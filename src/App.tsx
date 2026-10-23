import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { HeroSection } from './components/HeroSection.js';
import { SummaryMetrics } from './components/SummaryMetrics.js';
import { TaskManagement } from './components/TaskManagement.js';
import { DailySchedule } from './components/DailySchedule.js';
import { ConversationalAssistant } from './components/ConversationalAssistant.js';
import { McpInspector } from './components/McpInspector.js';
import { ActivityFeed } from './components/ActivityFeed.js';
import { Task, DayPlan, ActivityItem, ChatMessage, Priority } from './types/index.js';
import {
  fetchTasks,
  fetchLatestPlan,
  fetchActivity,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  generatePlan,
  sendChatMessage,
  loadDemoData,
  resetDemoData,
  updateAiMode,
} from './lib/api.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [aiMode, setAiMode] = useState<'local' | 'bedrock'>('local');
  const [availableMinutes, setAvailableMinutes] = useState<number>(180);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [taskSort, setTaskSort] = useState<string>('default');

  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Chat message state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Hello! I'm Daymark, your Alexa+ productivity assistant. Try typing: \"I have three hours tomorrow. Plan my tasks.\", \"Add revise calculus for 45 minutes.\", or \"Mark the project prototype complete.\"",
      timestamp: new Date().toISOString(),
      mode: 'local',
    },
  ]);

  // Load initial backend state
  const refreshData = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedPlan, fetchedActivities] = await Promise.all([
        fetchTasks(taskFilter, taskSort),
        fetchLatestPlan(),
        fetchActivity(25),
      ]);
      setTasks(fetchedTasks);
      setPlan(fetchedPlan);
      setActivities(fetchedActivities);
    } catch (err) {
      console.error('Error refreshing Daymark data:', err);
    }
  }, [taskFilter, taskSort]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle Load Demo Data
  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      await loadDemoData();
      await refreshData();
      // Generate default plan for the demo data
      const newPlan = await generatePlan({ availableMinutes: 180, startTime: '09:00' });
      setPlan(newPlan);
      await refreshData();
    } catch (err) {
      console.error('Failed to load demo data:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Handle Reset Demo Data
  const handleResetDemo = async () => {
    await resetDemoData();
    setPlan(null);
    await refreshData();
  };

  // Handle Plan Generation
  const handleGeneratePlan = async (options?: { availableMinutes?: number; startTime?: string }) => {
    setIsGeneratingPlan(true);
    try {
      const finalMinutes = options?.availableMinutes || availableMinutes;
      const finalStart = options?.startTime || '09:00';
      const newPlan = await generatePlan({
        availableMinutes: finalMinutes,
        startTime: finalStart,
        includeBreaks: true,
      });
      setPlan(newPlan);
      await refreshData();
    } catch (err) {
      console.error('Failed to generate plan:', err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Handle Task Mutations
  const handleCreateTask = async (data: {
    title: string;
    durationMinutes: number;
    priority: Priority;
    deadline?: string;
  }) => {
    await createTask(data);
    await refreshData();
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates);
    await refreshData();
  };

  const handleCompleteTask = async (id: string) => {
    await completeTask(id);
    await refreshData();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    await refreshData();
  };

  // Handle AI Provider Toggle
  const handleToggleAiMode = async (mode: 'local' | 'bedrock') => {
    setAiMode(mode);
    try {
      await updateAiMode(mode);
    } catch (err) {
      console.error('Failed to update AI mode:', err);
    }
  };

  // Handle Conversational Chat Request
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    const res = await sendChatMessage(text, aiMode);

    const assistantMsg: ChatMessage = {
      id: `ast-${Date.now()}`,
      sender: 'assistant',
      text: res.message,
      timestamp: new Date().toISOString(),
      actionTaken: res.actionTaken,
      toolInvoked: res.toolsUsed?.[0],
      mode: res.mode,
      metrics: res.metrics,
    };
    setChatMessages((prev) => [...prev, assistantMsg]);

    if (res.plan) {
      setPlan(res.plan);
    }
    await refreshData();
    return res;
  };

  // Calculated Real Summary Metrics
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const scheduledMinutes = plan?.totalScheduledMinutes || 0;
  const utilizationPercent = plan?.utilizationPercent || 0;

  const currentDateText = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="flex min-h-screen bg-[#090A0F] text-slate-100 antialiased selection:bg-lime-400/20 selection:text-lime-300">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingCount}
        scheduledMinutes={scheduledMinutes}
        aiMode={aiMode}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentDateText={currentDateText}
          aiMode={aiMode}
          onToggleAiMode={handleToggleAiMode}
          onLoadDemo={handleLoadDemo}
          onResetDemo={handleResetDemo}
          isLoadingDemo={isLoadingDemo}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Banner with Available Time Selector */}
              <HeroSection
                availableMinutes={availableMinutes}
                onChangeAvailableMinutes={setAvailableMinutes}
                onGeneratePlan={() => handleGeneratePlan({ availableMinutes })}
                isGenerating={isGeneratingPlan}
                pendingCount={pendingCount}
              />

              {/* Summary Metrics */}
              <SummaryMetrics
                pendingCount={pendingCount}
                scheduledMinutes={scheduledMinutes}
                completedCount={completedCount}
                utilizationPercent={utilizationPercent}
                availableMinutes={availableMinutes}
              />

              {/* Two Column Split: Left Tasks, Right Daily Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 6 cols: Tasks */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      My Tasks
                    </h3>
                    <button
                      onClick={() => setCurrentTab('tasks')}
                      className="text-xs text-lime-400 hover:text-lime-300 font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  <TaskManagement
                    tasks={tasks.slice(0, 5)}
                    filter={taskFilter}
                    onFilterChange={setTaskFilter}
                    sort={taskSort}
                    onSortChange={setTaskSort}
                    onCreateTask={handleCreateTask}
                    onUpdateTask={handleUpdateTask}
                    onCompleteTask={handleCompleteTask}
                    onDeleteTask={handleDeleteTask}
                    onLoadDemo={handleLoadDemo}
                  />
                </div>

                {/* Right 6 cols: Daily Plan Timeline */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      Today's Schedule
                    </h3>
                    <button
                      onClick={() => setCurrentTab('plan')}
                      className="text-xs text-lime-400 hover:text-lime-300 font-medium"
                    >
                      Full Timeline →
                    </button>
                  </div>
                  <DailySchedule
                    plan={plan}
                    onGeneratePlan={handleGeneratePlan}
                    isGenerating={isGeneratingPlan}
                    onCompleteTask={handleCompleteTask}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY TASKS */}
          {currentTab === 'tasks' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Task Management</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Organize, sort, and prioritize your goals. All records persist in local SQLite.
                </p>
              </div>
              <TaskManagement
                tasks={tasks}
                filter={taskFilter}
                onFilterChange={setTaskFilter}
                sort={taskSort}
                onSortChange={setTaskSort}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onCompleteTask={handleCompleteTask}
                onDeleteTask={handleDeleteTask}
                onLoadDemo={handleLoadDemo}
              />
            </div>
          )}

          {/* TAB 3: DAILY PLAN */}
          {currentTab === 'plan' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Deterministic Daily Plan</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Time-blocked schedule with cognitive breaks, strict non-overlapping constraints, and conflict detection.
                </p>
              </div>
              <DailySchedule
                plan={plan}
                onGeneratePlan={handleGeneratePlan}
                isGenerating={isGeneratingPlan}
                onCompleteTask={handleCompleteTask}
              />
            </div>
          )}

          {/* TAB 4: ALEXA+ CONVERSATIONAL ASSISTANT */}
          {currentTab === 'assistant' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Alexa+ Conversational Simulation</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Experience natural-language productivity commands translated into concrete mutations and real schedules.
                </p>
              </div>
              <ConversationalAssistant
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                aiMode={aiMode}
              />
            </div>
          )}

          {/* TAB 5: MCP INSPECTOR */}
          {currentTab === 'mcp' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Model Context Protocol (MCP) Inspector</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Verify the genuine Streamable HTTP MCP server exposing 8 tools over JSON-RPC 2.0.
                </p>
              </div>
              <McpInspector onRefreshData={refreshData} />
            </div>
          )}

          {/* TAB 6: ACTIVITY FEED */}
          {currentTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Activity Feed</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time audit log of all task updates, schedule runs, and tool invocations.
                </p>
              </div>
              <ActivityFeed activities={activities} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
