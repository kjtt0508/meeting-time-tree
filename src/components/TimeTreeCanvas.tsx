// src/components/TimeTreeCanvas.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Project, Meeting } from "@/types";
import {
  dateToY,
  projectToX,
  COLUMN_WIDTH,
  TIME_ORIGIN_Y,
  PIXELS_PER_DAY,
} from "@/utils/layout";
import {
  fetchProjects,
  fetchMeetings,
  fetchPlan,
  insertProject,
  insertMeeting,
  updateMeeting,
  deleteMeeting,
  deleteProject,
  fetchEdges,
  insertEdge,
  deleteEdge,
  deleteEdgesByMeetingId,
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import MeetingNode from "./MeetingNode";
import MeetingDetailModal from "./MeetingDetailModal";
import Sidebar from "./Sidebar";
import TimelineRuler from "./TimelineRuler";
import { v4 as uuidv4 } from "uuid";

const nodeTypes: NodeTypes = { meetingCard: MeetingNode };

const SIDEBAR_WIDTH = 256;
const DEFAULT_ZOOM = 0.12;
const ABSOLUTE_ORIGIN = "2020-01-01";
const FREE_PLAN_PROJECT_LIMIT = 3;

function buildHeaderNode(pj: Project): Node {
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
function TimeTreeCanvasInner({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const meetingsRef = useRef(meetings);
  useEffect(() => { meetingsRef.current = meetings; }, [meetings]);

  const { setViewport } = useReactFlow();

  // 初回データ取得
  useEffect(() => {
    (async () => {
      const [pjs, mtgs, userPlan, savedEdges] = await Promise.all([
        fetchProjects(userId),
        fetchMeetings(userId),
        fetchPlan(userId),
        fetchEdges(userId),
      ]);
      setProjects(pjs);
      setMeetings(mtgs);
      setPlan(userPlan);
      setExtraEdges(savedEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "#94A3B8", strokeWidth: 2, strokeDasharray: "6 3" },
      })));
      setLoading(false);
    })();
  }, [userId]);

  // upgraded=true のクエリパラメータがある場合はプランを再取得
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      fetchPlan(userId).then((newPlan) => {
        setPlan(newPlan);
        // クエリパラメータを消す
        window.history.replaceState({}, "", "/");
      });
    }
  }, [userId]);

  const [extraEdges, setExtraEdges, onEdgesChange] = useEdgesState<Edge>([]);

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

  // ノード初期値（ローディング完了後に設定）
  const initialNodes: Node[] = [];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // projects/meetings が変わったらノードを同期
  useEffect(() => {
    if (loading) return;
    setNodes((prevNodes) => {
      const posMap: Record<string, { x: number; y: number }> = {};
      prevNodes.forEach((n) => { posMap[n.id] = n.position; });

      const headers = projects.map(buildHeaderNode);
      const cards = meetings.flatMap((m) => {
        const pj = projects.find((p) => p.id === m.projectId);
        if (!pj) return [];
        const node = buildMeetingNode(m, pj, handleOpenDetail);
        if (posMap[m.id]) node.position = posMap[m.id];
        return [node];
      });
      return [...headers, ...cards];
    });
  }, [projects, meetings, handleOpenDetail, setNodes, loading]);

  // 起動時に今日を中央に（ノード描画後に実行するため少し遅延）
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
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
    }, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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

  const edges: Edge[] = useMemo(
    () => [...derivedEdges, ...extraEdges],
    [derivedEdges, extraEdges]
  );

  const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
    for (const edge of deletedEdges) {
      if (edge.id.startsWith("e-custom-")) {
        await deleteEdge(edge.id);
      }
    }
  }, []);

  const onConnect = useCallback(
    async (params: Connection) => {
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
      await insertEdge(userId, { id: newEdge.id, source: newEdge.source, target: newEdge.target });
    },
    [setExtraEdges, userId]
  );

  // ---- ハンドラ ----

  const handleAddProject = useCallback(async (project: Project) => {
    // 無料プランは3個まで
    if (plan === "free" && projects.length >= FREE_PLAN_PROJECT_LIMIT) {
      alert(`無料プランはプロジェクトを${FREE_PLAN_PROJECT_LIMIT}個まで作成できます。\nProプランにアップグレードすると無制限になります。`);
      return;
    }
    setProjects((prev) => [...prev, project]);
    await insertProject(userId, project);
  }, [plan, projects.length, userId]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    const deletedIds = new Set(
      meetingsRef.current.filter((m) => m.projectId === projectId).map((m) => m.id)
    );
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setMeetings((prev) => prev.filter((m) => m.projectId !== projectId));
    setNodes((nds) => nds.filter((n) => n.id !== `header-${projectId}` && !deletedIds.has(n.id)));
    setExtraEdges((eds) => eds.filter((e: Edge) => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
    await deleteProject(projectId);
    for (const id of deletedIds) {
      await deleteEdgesByMeetingId(id);
    }
  }, [setNodes, setExtraEdges]);

  const handleAddMeeting = useCallback(async (projectId: string) => {
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
    await insertMeeting(userId, newMeeting);
  }, [projects, userId]);

  const handleSaveMeeting = useCallback(async (updated: Meeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    // 会議日が変わった場合はノードのY座標をリセット（posMapを上書き）
    setNodes((nds) => nds.map((n) => {
      if (n.id !== updated.id) return n;
      const pj = projects.find((p) => p.id === updated.projectId);
      if (!pj) return n;
      return {
        ...n,
        position: {
          x: n.position.x,
          y: dateToY(updated.meetingDate, ABSOLUTE_ORIGIN),
        },
      };
    }));
    setModalOpen(false);
    await updateMeeting(updated);
  }, [projects, setNodes]);

  const handleDeleteMeeting = useCallback(async (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setExtraEdges((eds) => eds.filter((e: Edge) => e.source !== id && e.target !== id));
    setModalOpen(false);
    await deleteMeeting(id);
    await deleteEdgesByMeetingId(id);
  }, [setNodes, setExtraEdges]);

  const handleExport = useCallback(async () => {
    if (plan !== "pro") {
      alert("Proプランにアップグレードが必要です。");
      return;
    }
    const target = document.querySelector<HTMLElement>(".react-flow__renderer");
    if (!target) {
      alert("キャンバスの取得に失敗しました。");
      return;
    }
    try {
      const canvas = await html2canvas(target, {
        backgroundColor: "#f1f5f9",
        scale: 1,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      link.download = `meeting-time-tree-${today}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("エクスポートに失敗しました:", e);
      alert("エクスポートに失敗しました。もう一度お試しください。");
    }
  }, [plan]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const handleCancel = useCallback(async () => {
    const confirmed = window.confirm("サブスクリプションを解約しますか？\n現在の期間終了後にFreeプランに戻ります。");
    if (!confirmed) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/stripe/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
      }),
    });

    if (res.ok) {
      setPlan("free");
      alert("解約しました。現在の期間終了後にFreeプランに移行します。");
    } else {
      alert("解約に失敗しました。もう一度お試しください。");
    }
  }, []);

  const handleUpgrade = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
      }),
    });
    const { url } = await res.json();
    if (url) window.open(url, "_blank");
  }, []);

  const handleBuyOnce = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/stripe/one-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
      }),
    });
    const { url } = await res.json();
    if (url) window.open(url, "_blank");
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen">
      <Sidebar
        projects={projects}
        plan={plan}
        onAddProject={handleAddProject}
        onAddMeeting={handleAddMeeting}
        onDeleteProject={handleDeleteProject}
        onLogout={handleLogout}
        onUpgrade={handleUpgrade}
        onBuyOnce={handleBuyOnce}
        onCancel={handleCancel}
        onExport={handleExport}
      />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          deleteKeyCode={["Backspace", "Delete"]}
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
            style={{ marginLeft: 88 }}
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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  if (!userId) return null;

  return (
    <ReactFlowProvider>
      <TimeTreeCanvasInner userId={userId} />
    </ReactFlowProvider>
  );
}