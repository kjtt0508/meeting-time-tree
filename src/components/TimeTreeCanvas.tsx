// src/components/TimeTreeCanvas.tsx

"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Project, Meeting } from "@/types";
import { sampleProjects, sampleMeetings } from "@/data/sampleData";
import {
  dateToY,
  projectToX,
  getEarliestDate,
  COLUMN_WIDTH,
} from "@/utils/layout";
import MeetingNode from "./MeetingNode";
import MeetingDetailModal from "./MeetingDetailModal";
import Sidebar from "./Sidebar";
import TimelineBackground from "./TimelineBackground";
import { v4 as uuidv4 } from "uuid";

// --- React Flow にカスタムノードを登録 ---
const nodeTypes: NodeTypes = {
  meetingCard: MeetingNode,
};

/**
 * Meeting → React Flow Node に変換
 */
function meetingToNode(
  m: Meeting,
  project: Project,
  earliestDate: string,
  onOpenDetail: (id: string) => void
): Node {
  return {
    id: m.id,
    type: "meetingCard",
    position: {
      x: projectToX(project),
      y: dateToY(m.meetingDate, earliestDate),
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

export default function TimeTreeCanvas() {
  // --- State ---
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [meetings, setMeetings] = useState<Meeting[]>(sampleMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const earliestDate = useMemo(() => getEarliestDate(meetings), [meetings]);

  // 詳細モーダルを開く
  const handleOpenDetail = useCallback(
    (nodeId: string) => {
      const mtg = meetings.find((m) => m.id === nodeId);
      if (mtg) {
        setSelectedMeeting(mtg);
        setModalOpen(true);
      }
    },
    [meetings]
  );

  // --- Nodes & Edges ---
  const initialNodes: Node[] = useMemo(() => {
    // プロジェクトヘッダーノード
    const headers: Node[] = projects.map((pj) => ({
      id: `header-${pj.id}`,
      type: "default",
      position: { x: projectToX(pj), y: 10 },
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
    }));

    // 会議カードノード
    const cards: Node[] = meetings.map((m) => {
      const pj = projects.find((p) => p.id === m.projectId)!;
      return meetingToNode(m, pj, earliestDate, handleOpenDetail);
    });

    return [...headers, ...cards];
  }, [projects, meetings, earliestDate, handleOpenDetail]);

  // 同一プロジェクト内の時系列エッジ（デフォルト）
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (const pj of projects) {
      const pjMeetings = meetings
        .filter((m) => m.projectId === pj.id)
        .sort(
          (a, b) =>
            new Date(a.meetingDate).getTime() -
            new Date(b.meetingDate).getTime()
        );
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // ノード間を手動で線でつなぐ
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#94A3B8", strokeWidth: 2, strokeDasharray: "6 3" },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // --- 会議カードの保存 ---
  const handleSaveMeeting = useCallback(
    (updated: Meeting) => {
      setMeetings((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      // ノードのデータも更新
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === updated.id) {
            return {
              ...n,
              position: {
                ...n.position,
                y: dateToY(updated.meetingDate, earliestDate),
              },
              data: {
                ...n.data,
                label: updated.title,
                meetingDate: updated.meetingDate,
                decisions: updated.decisions,
                nextTasks: updated.nextTasks,
                attachmentUrl: updated.attachmentUrl,
              },
            };
          }
          return n;
        })
      );
      setModalOpen(false);
    },
    [earliestDate, setNodes]
  );

  // --- 会議カードの削除 ---
  const handleDeleteMeeting = useCallback(
    (id: string) => {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) =>
        eds.filter((e) => e.source !== id && e.target !== id)
      );
      setModalOpen(false);
    },
    [setNodes, setEdges]
  );

  // --- プロジェクト追加 ---
  const handleAddProject = useCallback(
    (project: Project) => {
      setProjects((prev) => [...prev, project]);
      // ヘッダーノード追加
      setNodes((nds) => [
        ...nds,
        {
          id: `header-${project.id}`,
          type: "default",
          position: { x: projectToX(project), y: 10 },
          data: { label: project.name },
          draggable: false,
          selectable: false,
          style: {
            background: project.color,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            width: COLUMN_WIDTH - 40,
            textAlign: "center" as const,
            borderRadius: 8,
            border: "none",
          },
        },
      ]);
    },
    [setNodes]
  );

  // --- 会議追加 ---
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

      const node = meetingToNode(newMeeting, pj, earliestDate, handleOpenDetail);
      setNodes((nds) => [...nds, node]);

      // 自動で詳細モーダルを開く
      setSelectedMeeting(newMeeting);
      setModalOpen(true);
    },
    [projects, earliestDate, handleOpenDetail, setNodes]
  );

  return (
    <div className="flex h-screen w-screen">
      {/* サイドバー */}
      <Sidebar
        projects={projects}
        onAddProject={handleAddProject}
        onAddMeeting={handleAddMeeting}
      />

      {/* メインキャンバス */}
      <div className="flex-1 relative">
        {/* タイムライン月ラベル (React Flow の上にオーバーレイ) */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
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
          <Panel position="top-left">
            <TimelineBackground
              earliestDate={earliestDate}
              monthCount={8}
            />
          </Panel>
        </ReactFlow>
      </div>

      {/* 詳細モーダル */}
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
