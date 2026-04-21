import type { Page, Route } from '@playwright/test'

interface MockControlPlaneOptions {
  authenticated?: boolean
}

interface MockClusterState {
  swarm: Record<string, unknown>
  nodes: Array<Record<string, unknown>>
  stacks: Array<Record<string, unknown>>
  services: Array<Record<string, unknown>>
  tasks: Array<Record<string, unknown>>
  networks: Array<Record<string, unknown>>
  volumes: Array<Record<string, unknown>>
  secrets: Array<Record<string, unknown>>
  configs: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  findings: Array<Record<string, unknown>>
  actionRuns: Array<Record<string, unknown>>
  approvals: Array<Record<string, unknown>>
  incidents: Array<Record<string, unknown>>
  sessions: Array<Record<string, unknown>>
}

interface MockState {
  auth: Record<string, unknown>
  clusters: Array<Record<string, unknown>>
  defaultClusterID: string
  byClusterID: Record<string, MockClusterState>
  counters: {
    approval: number
    actionRun: number
    session: number
    message: number
  }
}

const NOW = '2026-04-21T12:00:00.000Z'
const LATER = '2026-04-21T12:05:00.000Z'
const EXPIRES = '2026-04-21T18:00:00.000Z'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createMockState(options: MockControlPlaneOptions = {}): MockState {
  const primaryClusterID = 'cluster-primary'
  const edgeClusterID = 'cluster-edge'

  const clusters = [
    {
      id: primaryClusterID,
      name: 'primary',
      dockerHost: 'demo',
      connectionMode: 'demo',
      tlsEnabled: false,
      certRef: '',
      enabled: true,
      default: true,
      createdAt: NOW,
      updatedAt: LATER,
      health: {
        freshness: 'live',
        lastSyncAt: LATER,
        managers: 2,
        workers: 3,
        reachable: true,
      },
    },
    {
      id: edgeClusterID,
      name: 'edge',
      dockerHost: 'demo',
      connectionMode: 'demo',
      tlsEnabled: false,
      certRef: '',
      enabled: true,
      default: false,
      createdAt: NOW,
      updatedAt: LATER,
      health: {
        freshness: 'live',
        lastSyncAt: LATER,
        managers: 1,
        workers: 2,
        reachable: true,
      },
    },
  ]

  const commonRisk = {
    score: 0.34,
    confidence: 0.88,
    factors: ['replica drift', 'recent rollout pressure'],
    source: 'deterministic',
    updatedAt: LATER,
  }

  return {
    auth:
      options.authenticated === false
        ? {
            authenticated: false,
          }
        : {
            authenticated: true,
            username: 'ops-admin',
            role: 'admin',
            provider: 'session',
            groups: ['sre', 'admins'],
            csrfToken: 'csrf-token-123',
            expiresAt: EXPIRES,
          },
    clusters,
    defaultClusterID: primaryClusterID,
    byClusterID: {
      [primaryClusterID]: {
        swarm: {
          clusterID: primaryClusterID,
          createdAt: NOW,
          updatedAt: LATER,
          managers: 2,
          workers: 3,
          quorumHealthy: true,
          raftState: 'healthy',
          mode: 'demo',
          writeEnabled: true,
          freshness: 'live',
          lastSyncAt: LATER,
          risk: commonRisk,
        },
        nodes: [
          {
            id: 'node-primary-1',
            hostname: 'primary-manager-1',
            role: 'manager',
            availability: 'active',
            state: 'ready',
            labels: { zone: 'eu-west-1' },
            cpuTotal: 4000000000,
            cpuReserved: 1500000000,
            memTotal: 8589934592,
            memReserved: 3221225472,
            runningTasks: 5,
            engineVersion: '27.0.0',
            addr: '10.0.0.10',
            managerStatus: {
              leader: true,
              reachability: 'reachable',
            },
          },
        ],
        stacks: [
          {
            name: 'web',
            serviceCount: 2,
            runningServices: 2,
            totalReplicas: 4,
            runningReplicas: 3,
            healthScore: 74,
          },
        ],
        services: [
          {
            id: 'svc-frontend-01',
            name: 'frontend',
            stack: 'web',
            image: 'acme/frontend:v3.0.0',
            mode: 'replicated',
            desiredReplicas: 2,
            runningTasks: 1,
            failedTasks: 1,
            updateState: 'paused',
            updateParallelism: 1,
            updateDelay: '10s',
            updateFailureAction: 'pause',
            rollbackParallelism: 1,
            rollbackDelay: '5s',
            constraints: [],
            preferences: [],
            publishedPorts: [{ publishedPort: 443, targetPort: 3000, protocol: 'tcp' }],
            secretRefs: [],
            configRefs: [],
            networkRefs: ['web_default'],
            createdAt: NOW,
            updatedAt: LATER,
          },
          {
            id: 'svc-api-01',
            name: 'api',
            stack: 'web',
            image: 'acme/api:v2.4.1',
            mode: 'replicated',
            desiredReplicas: 2,
            runningTasks: 2,
            failedTasks: 0,
            updateState: 'completed',
            updateParallelism: 1,
            updateDelay: '10s',
            updateFailureAction: 'pause',
            rollbackParallelism: 1,
            rollbackDelay: '5s',
            constraints: [],
            preferences: [],
            publishedPorts: [{ publishedPort: 8080, targetPort: 8080, protocol: 'tcp' }],
            secretRefs: [],
            configRefs: [],
            networkRefs: ['web_default'],
            createdAt: NOW,
            updatedAt: LATER,
          },
        ],
        tasks: [
          {
            id: 'task-primary-1',
            serviceID: 'svc-api-01',
            serviceName: 'api',
            nodeID: 'node-primary-1',
            nodeHostname: 'primary-manager-1',
            desiredState: 'running',
            currentState: 'running',
            error: '',
            image: 'acme/api:v2.4.1',
            restartCount: 0,
            createdAt: NOW,
            updatedAt: LATER,
          },
          {
            id: 'task-primary-2',
            serviceID: 'svc-frontend-01',
            serviceName: 'frontend',
            nodeID: 'node-primary-1',
            nodeHostname: 'primary-manager-1',
            desiredState: 'running',
            currentState: 'failed',
            error: 'task failure ratio exceeded',
            image: 'acme/frontend:v3.0.0',
            restartCount: 3,
            createdAt: NOW,
            updatedAt: LATER,
          },
        ],
        networks: [
          { id: 'network-primary', name: 'web_default', driver: 'overlay', scope: 'swarm' },
        ],
        volumes: [],
        secrets: [],
        configs: [],
        events: [
          {
            type: 'service',
            action: 'update',
            actor: 'frontend',
            message: 'service update paused',
            timestamp: LATER,
          },
        ],
        findings: [
          {
            id: 'finding-primary-1',
            plugin: 'deployment',
            title: 'Frontend rollout is paused',
            summary: 'The frontend deployment paused after repeated task failures.',
            severity: 'high',
            category: 'availability',
            resourceType: 'service',
            resourceID: 'svc-frontend-01',
            evidence: ['update state paused'],
            createdAt: NOW,
          },
        ],
        actionRuns: [
          {
            id: 'run-primary-1',
            clusterID: primaryClusterID,
            action: 'service.rollback',
            resource: 'service',
            resourceID: 'svc-frontend-01',
            requestedBy: 'ops-admin',
            requestedRole: 'admin',
            reason: 'Rollback the stalled frontend deployment.',
            status: 'pending_approval',
            mode: 'approval',
            executed: false,
            approvalRequired: true,
            approvalID: 'approval-primary-1',
            message: 'Action is pending admin approval.',
            createdAt: NOW,
            updatedAt: NOW,
          },
          {
            id: 'run-primary-2',
            clusterID: primaryClusterID,
            action: 'telemetry.refresh',
            resource: 'telemetry',
            resourceID: 'primary',
            requestedBy: 'ops-admin',
            requestedRole: 'admin',
            reason: 'Refresh the cluster state.',
            status: 'success',
            mode: 'live',
            executed: true,
            approvalRequired: false,
            message: 'Telemetry refresh completed.',
            createdAt: NOW,
            updatedAt: LATER,
          },
        ],
        approvals: [
          {
            id: 'approval-primary-1',
            clusterID: primaryClusterID,
            actionRunID: 'run-primary-1',
            action: 'service.rollback',
            resource: 'service',
            resourceID: 'svc-frontend-01',
            requestedBy: 'ops-admin',
            requestedRole: 'admin',
            reason: 'Rollback the stalled frontend deployment.',
            status: 'pending',
            createdAt: NOW,
          },
        ],
        incidents: [
          {
            id: 'incident-primary-1',
            clusterID: primaryClusterID,
            title: 'Frontend rollout paused',
            description: 'The frontend rollout is stalled and requires operator attention.',
            severity: 'high',
            status: 'investigating',
            createdBy: 'ops-admin',
            createdAt: NOW,
            updatedAt: NOW,
            affectedServices: ['svc-frontend-01'],
            diagnosticRefs: ['finding-primary-1'],
            runbookSteps: [],
            timeline: [
              {
                id: 'timeline-primary-1',
                actor: 'ops-admin',
                action: 'created',
                note: 'Opened from diagnostics.',
                timestamp: NOW,
              },
            ],
          },
        ],
        sessions: [],
      },
      [edgeClusterID]: {
        swarm: {
          clusterID: edgeClusterID,
          createdAt: NOW,
          updatedAt: LATER,
          managers: 1,
          workers: 2,
          quorumHealthy: true,
          raftState: 'healthy',
          mode: 'demo',
          writeEnabled: true,
          freshness: 'live',
          lastSyncAt: LATER,
          risk: {
            score: 0.12,
            confidence: 0.91,
            factors: ['steady replica health'],
            source: 'deterministic',
            updatedAt: LATER,
          },
        },
        nodes: [
          {
            id: 'node-edge-1',
            hostname: 'edge-manager-1',
            role: 'manager',
            availability: 'active',
            state: 'ready',
            labels: { zone: 'edge-1' },
            cpuTotal: 4000000000,
            cpuReserved: 800000000,
            memTotal: 8589934592,
            memReserved: 2147483648,
            runningTasks: 2,
            engineVersion: '27.0.0',
            addr: '10.10.0.10',
            managerStatus: {
              leader: true,
              reachability: 'reachable',
            },
          },
        ],
        stacks: [
          {
            name: 'edge-web',
            serviceCount: 1,
            runningServices: 1,
            totalReplicas: 1,
            runningReplicas: 1,
            healthScore: 100,
          },
        ],
        services: [
          {
            id: 'svc-edge-api-01',
            name: 'edge-api',
            stack: 'edge-web',
            image: 'acme/edge-api:v1.1.0',
            mode: 'replicated',
            desiredReplicas: 1,
            runningTasks: 1,
            failedTasks: 0,
            updateState: 'completed',
            updateParallelism: 1,
            updateDelay: '10s',
            updateFailureAction: 'pause',
            rollbackParallelism: 1,
            rollbackDelay: '5s',
            constraints: [],
            preferences: [],
            publishedPorts: [{ publishedPort: 8443, targetPort: 8443, protocol: 'tcp' }],
            secretRefs: [],
            configRefs: [],
            networkRefs: ['edge_default'],
            createdAt: NOW,
            updatedAt: LATER,
          },
        ],
        tasks: [
          {
            id: 'task-edge-1',
            serviceID: 'svc-edge-api-01',
            serviceName: 'edge-api',
            nodeID: 'node-edge-1',
            nodeHostname: 'edge-manager-1',
            desiredState: 'running',
            currentState: 'running',
            error: '',
            image: 'acme/edge-api:v1.1.0',
            restartCount: 0,
            createdAt: NOW,
            updatedAt: LATER,
          },
        ],
        networks: [{ id: 'network-edge', name: 'edge_default', driver: 'overlay', scope: 'swarm' }],
        volumes: [],
        secrets: [],
        configs: [],
        events: [],
        findings: [],
        actionRuns: [
          {
            id: 'run-edge-1',
            clusterID: edgeClusterID,
            action: 'service.restart',
            resource: 'service',
            resourceID: 'svc-edge-api-01',
            requestedBy: 'ops-admin',
            requestedRole: 'admin',
            reason: 'Restart edge-api after config refresh.',
            status: 'success',
            mode: 'demo',
            executed: true,
            approvalRequired: false,
            message: 'Action simulated in demo mode.',
            createdAt: NOW,
            updatedAt: LATER,
          },
        ],
        approvals: [],
        incidents: [
          {
            id: 'incident-edge-1',
            clusterID: edgeClusterID,
            title: 'Cache warm-up delay',
            description: 'The edge cache warmed up slowly after restart.',
            severity: 'medium',
            status: 'resolved',
            createdBy: 'ops-admin',
            createdAt: NOW,
            updatedAt: LATER,
            resolvedAt: LATER,
            affectedServices: ['svc-edge-api-01'],
            diagnosticRefs: [],
            runbookSteps: [],
            timeline: [
              {
                id: 'timeline-edge-1',
                actor: 'ops-admin',
                action: 'resolved',
                note: 'Recovered after warm-up.',
                timestamp: LATER,
              },
            ],
          },
        ],
        sessions: [],
      },
    },
    counters: {
      approval: 2,
      actionRun: 3,
      session: 1,
      message: 1,
    },
  }
}

function newID(prefix: string, value: number) {
  return `${prefix}-${value}`
}

function listResponse(items: unknown[]) {
  return {
    data: items,
    meta: {
      total: items.length,
    },
  }
}

async function readJSON(route: Route) {
  const raw = route.request().postData()
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

async function fulfillJSON(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

function resolveClusterPath(pathname: string, state: MockState) {
  const apiPath = pathname.replace(/^\/api\/v1/, '') || '/'
  if (apiPath.startsWith('/clusters/')) {
    const segments = apiPath.split('/').filter(Boolean)
    return {
      clusterID: segments[1] ?? state.defaultClusterID,
      subPath: `/${segments.slice(2).join('/')}`,
    }
  }
  return {
    clusterID: state.defaultClusterID,
    subPath: apiPath,
  }
}

function currentTimestamp() {
  return '2026-04-21T12:10:00.000Z'
}

function findClusterState(state: MockState, clusterID: string) {
  return state.byClusterID[clusterID] ?? state.byClusterID[state.defaultClusterID]
}

function createRollbackApproval(
  state: MockState,
  clusterID: string,
  serviceID: string,
  reason: string,
) {
  const cluster = findClusterState(state, clusterID)
  const now = currentTimestamp()
  const approvalID = newID('approval-generated', state.counters.approval++)
  const actionRunID = newID('run-generated', state.counters.actionRun++)

  const actionRun = {
    id: actionRunID,
    clusterID,
    action: 'service.rollback',
    resource: 'service',
    resourceID: serviceID,
    requestedBy: (state.auth.username as string | undefined) ?? 'ops-admin',
    requestedRole: (state.auth.role as string | undefined) ?? 'admin',
    reason,
    status: 'pending_approval',
    mode: 'approval',
    executed: false,
    approvalRequired: true,
    approvalID,
    message: 'Action is pending admin approval.',
    createdAt: now,
    updatedAt: now,
  }

  const approval = {
    id: approvalID,
    clusterID,
    actionRunID,
    action: 'service.rollback',
    resource: 'service',
    resourceID: serviceID,
    requestedBy: actionRun.requestedBy,
    requestedRole: actionRun.requestedRole,
    reason,
    status: 'pending',
    createdAt: now,
  }

  cluster.actionRuns.unshift(actionRun)
  cluster.approvals.unshift(approval)

  return {
    id: actionRunID,
    clusterID,
    action: 'service.rollback',
    resource: 'service',
    resourceID: serviceID,
    reason,
    status: 'pending_approval',
    mode: 'approval',
    executed: false,
    approvalID,
    approvalRequired: true,
    message: 'Action is pending admin approval.',
    timestamp: now,
  }
}

function approveAction(state: MockState, clusterID: string, approvalID: string) {
  const cluster = findClusterState(state, clusterID)
  const now = currentTimestamp()
  const approval = cluster.approvals.find((item) => item.id === approvalID)
  if (!approval) {
    return null
  }
  approval.status = 'approved'
  approval.resolvedAt = now
  approval.resolvedBy = 'ops-admin'
  approval.resolutionReason = 'approved'
  cluster.approvals = cluster.approvals.filter((item) => item.id !== approvalID)

  const run = cluster.actionRuns.find((item) => item.id === approval.actionRunID)
  if (run) {
    run.status = 'success'
    run.mode = 'live'
    run.executed = true
    run.message = 'Service rollback requested.'
    run.updatedAt = now
  }

  return {
    id: approval.actionRunID,
    clusterID,
    action: approval.action,
    resource: approval.resource,
    resourceID: approval.resourceID,
    reason: approval.reason,
    status: 'success',
    mode: 'live',
    executed: true,
    approvalID,
    approvalRequired: true,
    message: 'Service rollback requested.',
    timestamp: now,
  }
}

function resolveIncident(state: MockState, clusterID: string, incidentID: string) {
  const cluster = findClusterState(state, clusterID)
  const now = currentTimestamp()
  const incident = cluster.incidents.find((item) => item.id === incidentID)
  if (!incident) {
    return null
  }
  incident.status = 'resolved'
  incident.resolvedAt = now
  incident.updatedAt = now
  incident.timeline = [
    ...(Array.isArray(incident.timeline) ? incident.timeline : []),
    {
      id: `timeline-${incidentID}-resolved`,
      actor: 'ops-admin',
      action: 'resolved',
      note: 'Resolved from the incident command view.',
      timestamp: now,
    },
  ]
  return incident
}

function createAssistantSession(state: MockState, clusterID: string, title: string) {
  const cluster = findClusterState(state, clusterID)
  const session = {
    id: newID('session', state.counters.session++),
    clusterID,
    title,
    createdBy: (state.auth.username as string | undefined) ?? 'ops-admin',
    createdAt: currentTimestamp(),
    updatedAt: currentTimestamp(),
    messages: [],
  }
  cluster.sessions.unshift(session)
  return session
}

function pushAssistantResponse(
  state: MockState,
  clusterID: string,
  sessionID: string,
  prompt: string,
) {
  const cluster = findClusterState(state, clusterID)
  const session = cluster.sessions.find((item) => item.id === sessionID)
  if (!session) {
    return null
  }

  const citation = {
    id: 'citation-frontend-rollout',
    kind: 'finding',
    title: 'Frontend rollout is paused',
    locator: 'diagnostics/finding-primary-1',
    snippet: 'The frontend deployment paused after repeated task failures.',
  }
  const proposal = {
    title: 'Rollback frontend to the last healthy spec',
    action: 'service.rollback',
    resource: 'service',
    resourceID: 'svc-frontend-01',
    reason: 'Rollback the stalled frontend deployment to restore healthy replicas.',
    requiresApproval: true,
  }
  const assistantMessage = {
    id: newID('assistant-message', state.counters.message++),
    sessionID,
    role: 'assistant',
    content:
      'Primary risk is concentrated in the frontend rollout. Roll back the paused service first, then confirm replica health and error recovery.',
    citations: [citation],
    actionProposals: [proposal],
    createdAt: currentTimestamp(),
  }
  const userMessage = {
    id: newID('user-message', state.counters.message++),
    sessionID,
    role: 'user',
    content: prompt,
    createdAt: currentTimestamp(),
  }

  session.messages = [
    ...(Array.isArray(session.messages) ? session.messages : []),
    userMessage,
    assistantMessage,
  ]
  session.updatedAt = currentTimestamp()
  session.lastSummary = assistantMessage.content

  return {
    session,
    insight: {
      summary:
        'The frontend rollout is the highest-risk workload and is a strong rollback candidate.',
      risk: {
        score: 0.81,
        confidence: 0.92,
        factors: ['paused update state', 'replica drift'],
        source: 'hybrid',
        updatedAt: currentTimestamp(),
      },
      freshness: 'live',
      hypotheses: [
        {
          title: 'Paused deployment is suppressing healthy replicas',
          why: 'The frontend service is paused at 1/2 running replicas.',
          confidence: 0.9,
        },
      ],
      actions: [
        {
          title: 'Rollback the paused service',
          description: 'Return the frontend to the last healthy spec.',
          endpointHint: '/clusters/{clusterID}/services/{id}/rollback',
          priority: 1,
          actionability: 'immediate',
        },
      ],
      generatedAt: currentTimestamp(),
      provider: 'hybrid',
      sourceStrategy: 'deterministic+routed-llm',
    },
    citation,
    proposal,
    assistantMessage,
  }
}

async function handleRoute(route: Route, state: MockState) {
  const request = route.request()
  const url = new URL(request.url())
  const { pathname } = url
  const method = request.method()

  if (pathname === '/api/v1/auth/login' && method === 'GET') {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html><body><h1>Mock OIDC Login</h1><p>Return to SwarmLens after provider auth.</p></body></html>',
    })
    return
  }

  if (pathname === '/api/v1/auth/me' && method === 'GET') {
    await fulfillJSON(route, { data: clone(state.auth) })
    return
  }

  if (pathname === '/api/v1/auth/logout' && method === 'POST') {
    state.auth = { authenticated: false }
    await fulfillJSON(route, { data: { ok: true } })
    return
  }

  if (pathname === '/api/v1/clusters' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(state.clusters)))
    return
  }

  if (
    pathname.startsWith('/api/v1/clusters/') &&
    pathname.split('/').filter(Boolean).length === 4 &&
    method === 'GET'
  ) {
    const clusterID = pathname.split('/')[4]
    const cluster = state.clusters.find((item) => item.id === clusterID)
    await fulfillJSON(route, { data: clone(cluster ?? state.clusters[0]) })
    return
  }

  const { clusterID, subPath } = resolveClusterPath(pathname, state)
  const cluster = findClusterState(state, clusterID)

  if (subPath === '/swarm' && method === 'GET') {
    await fulfillJSON(route, { data: clone(cluster.swarm) })
    return
  }
  if (subPath === '/nodes' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.nodes)))
    return
  }
  if (subPath === '/stacks' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.stacks)))
    return
  }
  if (subPath === '/services' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.services)))
    return
  }
  if (subPath === '/tasks' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.tasks)))
    return
  }
  if (subPath === '/networks' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.networks)))
    return
  }
  if (subPath === '/volumes' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.volumes)))
    return
  }
  if (subPath === '/secrets' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.secrets)))
    return
  }
  if (subPath === '/configs' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.configs)))
    return
  }
  if (subPath === '/events' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.events)))
    return
  }
  if (subPath === '/diagnostics' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.findings)))
    return
  }
  if (subPath === '/actions' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.actionRuns)))
    return
  }
  if (subPath === '/approvals' && method === 'GET') {
    const status = url.searchParams.get('status')
    const approvals =
      status === 'pending'
        ? cluster.approvals.filter((item) => item.status === 'pending')
        : cluster.approvals
    await fulfillJSON(route, listResponse(clone(approvals)))
    return
  }
  if (subPath === '/incidents' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.incidents)))
    return
  }
  if (subPath === '/assistant/sessions' && method === 'GET') {
    await fulfillJSON(route, listResponse(clone(cluster.sessions)))
    return
  }
  if (subPath === '/assistant/sessions' && method === 'POST') {
    const body = await readJSON(route)
    const title =
      typeof body.title === 'string' && body.title.trim() !== ''
        ? body.title.trim()
        : 'Ops Copilot Session'
    const session = createAssistantSession(state, clusterID, title)
    await fulfillJSON(route, { data: clone(session) }, 201)
    return
  }
  if (subPath.startsWith('/assistant/sessions/') && method === 'GET') {
    const sessionID = subPath.split('/')[3]
    const session = cluster.sessions.find((item) => item.id === sessionID)
    await fulfillJSON(route, { data: clone(session ?? cluster.sessions[0]) })
    return
  }
  if (subPath === '/assistant/chat' && method === 'POST') {
    const body = await readJSON(route)
    const prompt = typeof body.prompt === 'string' ? body.prompt : 'What needs action right now?'
    const sessionID =
      typeof body.sessionID === 'string' && body.sessionID.trim() !== ''
        ? body.sessionID
        : createAssistantSession(state, clusterID, 'Ops Copilot Session').id
    const response = pushAssistantResponse(state, clusterID, sessionID, prompt)
    if (!response) {
      await fulfillJSON(route, { error: 'assistant session not found', code: 'not_found' }, 404)
      return
    }

    const streamBody = [
      `event: session\ndata: ${JSON.stringify(response.session)}`,
      `event: insight\ndata: ${JSON.stringify(response.insight)}`,
      `event: citation\ndata: ${JSON.stringify(response.citation)}`,
      `event: action_proposal\ndata: ${JSON.stringify(response.proposal)}`,
      `event: message\ndata: ${JSON.stringify(response.assistantMessage)}`,
      'event: done\ndata: {}',
    ].join('\n\n')

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `${streamBody}\n\n`,
    })
    return
  }
  if (subPath.startsWith('/approvals/') && subPath.endsWith('/approve') && method === 'POST') {
    const approvalID = subPath.split('/')[2]
    const outcome = approveAction(state, clusterID, approvalID)
    if (!outcome) {
      await fulfillJSON(route, { error: 'approval request not found', code: 'not_found' }, 404)
      return
    }
    await fulfillJSON(route, { data: clone(outcome) })
    return
  }
  if (subPath.startsWith('/incidents/') && subPath.endsWith('/resolve') && method === 'POST') {
    const incidentID = subPath.split('/')[2]
    const incident = resolveIncident(state, clusterID, incidentID)
    if (!incident) {
      await fulfillJSON(route, { error: 'incident not found', code: 'not_found' }, 404)
      return
    }
    await fulfillJSON(route, { data: clone(incident) })
    return
  }
  if (subPath.startsWith('/services/') && subPath.endsWith('/rollback') && method === 'POST') {
    const serviceID = subPath.split('/')[2]
    const body = await readJSON(route)
    const reason =
      typeof body.reason === 'string' && body.reason.trim() !== ''
        ? body.reason
        : 'Rollback the stalled frontend deployment to restore healthy replicas.'
    const outcome = createRollbackApproval(state, clusterID, serviceID, reason)
    await fulfillJSON(route, { data: clone(outcome) })
    return
  }

  await fulfillJSON(
    route,
    {
      error: `Unhandled mock route: ${method} ${pathname}`,
      code: 'mock_not_implemented',
    },
    501,
  )
}

export async function mockControlPlane(page: Page, options: MockControlPlaneOptions = {}) {
  const state = createMockState(options)

  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()

    class MockEventSource {
      url: string
      onopen: ((event: unknown) => void) | null = null
      onerror: ((event: unknown) => void) | null = null
      private listeners: Record<string, Array<(event: { data: string }) => void>> = {}

      constructor(url: string) {
        this.url = url
        window.setTimeout(() => {
          this.onopen?.({ type: 'open', url: this.url })
        }, 0)
      }

      addEventListener(type: string, callback: (event: { data: string }) => void) {
        this.listeners[type] = [...(this.listeners[type] ?? []), callback]
      }

      removeEventListener(type: string, callback: (event: { data: string }) => void) {
        this.listeners[type] = (this.listeners[type] ?? []).filter(
          (listener) => listener !== callback,
        )
      }

      close() {}
    }

    Object.defineProperty(window, 'EventSource', {
      configurable: true,
      writable: true,
      value: MockEventSource,
    })
  })

  await page.route('**/api/v1/**', async (route) => {
    await handleRoute(route, state)
  })
}
