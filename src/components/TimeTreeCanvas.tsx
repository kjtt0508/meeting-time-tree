// src/components/TimeTreeCanvas.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeChange,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Project, Meeting } from "@/types";
import { sampleProjects, sampleMeetings } from "@/data/sampleData";
import {
  dateToY,
  projectToX,
  getEarliestDate,
  COLUMN_WIDTH,
  TIME_ORIGIN_Y,
  PIXELS_PER_DAY,
} from "@/utils/layout";
import MeetingNode from "./MeetingNode";
import MeetingDetailModal from "./MeetingDetailModal";
import Sidebar from "./Sidebar";
import TimelineRuler from "./TimelineRuler";
import { v4 as uuidv4 } from "uuid";

const nodeTypes: NodeTypes = {
  meetingCard: MeetingNode,
};

const SIDEBAR_WIDTH = 256;
const DEFAULT_ZOOM = 0.12;

// Y座標の固定基準日（earliestDateに依存しない絶対座標）
const ABSOLUTE_ORIGIN = "2020-01-01";

function buildHeaderNode(pj: Project): Node {
  // earliestDate が渡された場合は作成日のY座標、なければ上部固定
  const y = pj.createdDate
    ? dateToY(pj.createdDate, ABSOLUTE_ORIGIN)
    : dateToY(new Date().toISOString().slice(0, 10), ABSOLUTE_ORIGIN);
  return {
    id: `header-${pj.id}`,
    type: "default",
    position: { x: projectToX(pj), y },
    data: { label: pj.name },
    draggable: false,
    selectable: false,
    style: {
      background: pj.color,
      color: "#fff",
      fontWeight: 700,
      fontSize: 14,
      width: COLUMN_WIDTH - 40,
      textAlign: "center" as const,
      borderRadius: 8,
      border: "none",
    },
  };
}

function buildMeetingNode(
  m: Meeting,
  project: Project,
  onOpenDetail: (id: string) => void
): Node {
  return {
    id: m.id,
    type: "meetingCard",
    position: {
      x: projectToX(project),
      y: dateToY(m.meetingDate, ABSOLUTE_ORIGIN),
    },
    data: {
      label: m.title,
      meetingDate: m.meetingDate,
      decisions: m.decisions,
      nextTasks: m.nextTasks,
      attachmentUrl: m.attachmentUrl,
      projectColor: project.color,
      onOpenDetail,
    },
  };
}

// ---- 内部コンポーネント ----
function TimeTreeCanvasInner() {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window === "undefined") return sampleProjects;
    const saved = localStorage.getItem("timetree-projects");
    return saved ? JSON.parse(saved) : sampleProjects;
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    if (typeof window === "undefined") return sampleMeetings;
    const saved = localStorage.getItem("timetree-meetings");
    return saved ? JSON.parse(saved) : sampleMeetings;
  });

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("timetree-projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("timetree-meetings", JSON.stringify(meetings));
  }, [meetings]);

  const earliestDate = useMemo(() => getEarliestDate(meetings), [meetings]);

  // meetings の最新値を同期的に参照するための ref
  const meetingsRef = useRef(meetings);
  useEffect(() => { meetingsRef.current = meetings; }, [meetings]);

  const { setViewport } = useReactFlow();

  const handleOpenDetail = useCallback((nodeId: string) => {
    setMeetings((prev) => {
      const mtg = prev.find((m) => m.id === nodeId);
      if (mtg) {
        setSelectedMeeting(mtg);
        setModalOpen(true);
      }
      return prev;
    });
  }, []);

  // --- useNodesState でノードを管理（ドラッグはReactFlow内部で完結） ---
  const initialNodes = useMemo(() => {
    const headers = projects.map((pj) => buildHeaderNode(pj));
    const cards = meetings.flatMap((m) => {
      const pj = projects.find((p) => p.id === m.projectId);
      if (!pj) return [];
      return [buildMeetingNode(m, pj, handleOpenDetail)];
    });
    return [...headers, ...cards];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回のみ

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // meetings/projects が外部から変わったとき（追加・編集・削除）だけノードを同期
  // ドラッグ位置は既存ノードから引き継ぐ
  useEffect(() => {
    setNodes((prevNodes) => {
      const posMap: Record<string, { x: number; y: number }> = {};
      prevNodes.forEach((n) => { posMap[n.id] = n.position; });

      // headerはsortOrder変更時にX座標を再計算するためposMapを使わない
      const headers = projects.map((pj) => buildHeaderNode(pj));
      const cards = meetings.flatMap((m) => {
        const pj = projects.find((p) => p.id === m.projectId);
        if (!pj) return []; // プロジェクトが見つからない場合はスキップ
        const node = buildMeetingNode(m, pj, handleOpenDetail);
        // ドラッグ済みの位置があれば引き継ぐ
        if (posMap[m.id]) node.position = posMap[m.id];
        return [node];
      });
      return [...headers, ...cards];
    });
  }, [projects, meetings, handleOpenDetail, setNodes]);

  // 起動時に今日を画面中央に
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCanvasY =
      TIME_ORIGIN_Y +
      ((new Date(today).getTime() - new Date(ABSOLUTE_ORIGIN).getTime()) / 86400000) *
        PIXELS_PER_DAY;
    const screenH = window.innerHeight;
    const screenW = window.innerWidth - SIDEBAR_WIDTH;
    const viewY = screenH / 2 - todayCanvasY * DEFAULT_ZOOM;
    const viewX = screenW / 2 - ((projects.length * (COLUMN_WIDTH + 40)) / 2) * DEFAULT_ZOOM;
    setViewport({ x: viewX, y: viewY, zoom: DEFAULT_ZOOM }, { duration: 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // edges
  const derivedEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (const pj of projects) {
      const pjMeetings = meetings
        .filter((m) => m.projectId === pj.id)
        .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
      for (let i = 0; i < pjMeetings.length - 1; i++) {
        edges.push({
          id: `e-${pjMeetings[i].id}-${pjMeetings[i + 1].id}`,
          source: pjMeetings[i].id,
          target: pjMeetings[i + 1].id,
          animated: true,
          style: { stroke: pj.color, strokeWidth: 2 },
        });
      }
    }
    return edges;
  }, [projects, meetings]);

  const [extraEdges, setExtraEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const edges: Edge[] = useMemo(
    () => [...derivedEdges, ...extraEdges],
    [derivedEdges, extraEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        id: `e-custom-${params.source}-${params.target}-${Date.now()}`,
        source: params.source ?? "",
        target: params.target ?? "",
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        animated: true,
        style: { stroke: "#94A3B8", strokeWidth: 2, strokeDasharray: "6 3" },
      };
      setExtraEdges((eds) => [...eds, newEdge]);
    },
    [setExtraEdges]
  );

  const handleSaveMeeting = useCallback((updated: Meeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setModalOpen(false);
  }, []);

  const handleDeleteMeeting = useCallback(
    (id: string) => {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setExtraEdges((eds) => eds.filter((e: Edge) => e.source !== id && e.target !== id));
      setModalOpen(false);
    },
    [setNodes, setExtraEdges]
  );

  const handleAddProject = useCallback((project: Project) => {
    setProjects((prev) => [...prev, project]);
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    const deletedIds = new Set(
      meetingsRef.current.filter((m) => m.projectId === projectId).map((m) => m.id)
    );
    // sortOrder はそのまま維持（変更するとX座標がずれる）
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setMeetings((prev) => prev.filter((m) => m.projectId !== projectId));
    setNodes((nds) => nds.filter((n) => n.id !== `header-${projectId}` && !deletedIds.has(n.id)));
    setExtraEdges((eds) => eds.filter((e: Edge) => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
  }, [setNodes, setExtraEdges]);

  const handleAddMeeting = useCallback(
    (projectId: string) => {
      const pj = projects.find((p) => p.id === projectId);
      if (!pj) return;
      const today = new Date().toISOString().slice(0, 10);
      const newMeeting: Meeting = {
        id: uuidv4(),
        projectId,
        title: "新しい会議",
        meetingDate: today,
        decisions: "",
        nextTasks: "",
        attachmentUrl: "",
      };
      setMeetings((prev) => [...prev, newMeeting]);
      setSelectedMeeting(newMeeting);
      setModalOpen(true);
    },
    [projects]
  );

  return (
    <div className="flex h-screen w-screen">
      <Sidebar
        projects={projects}
        onAddProject={handleAddProject}
        onAddMeeting={handleAddMeeting}
        onDeleteProject={handleDeleteProject}
      />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectOnClick={false}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="#f1f5f9" gap={20} />
          <Controls position="bottom-right" />
          <MiniMap
            nodeColor={(n) => {
              if (n.id.startsWith("header-")) return "#475569";
              return (n.data as Record<string, unknown>)?.projectColor as string ?? "#94A3B8";
            }}
            position="bottom-left"
          />
          <TimelineRuler earliestDate={ABSOLUTE_ORIGIN} sidebarWidth={SIDEBAR_WIDTH} />
        </ReactFlow>
      </div>

      <MeetingDetailModal
        meeting={selectedMeeting}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveMeeting}
        onDelete={handleDeleteMeeting}
      />
    </div>
  );
}

export default function TimeTreeCanvas() {
  return (
    <ReactFlowProvider>
      <TimeTreeCanvasInner />
    </ReactFlowProvider>
  );
}