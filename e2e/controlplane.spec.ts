import { expect, test } from '@playwright/test'
import { mockControlPlane } from './support/mockControlPlane'

test.describe('Control Plane Workflows', () => {
  test('shows the signed-in session banner and supports sign-out', async ({ page }) => {
    await mockControlPlane(page)
    await page.goto('/approvals')

    await expect(page.getByText('ops-admin · admin · session')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible()

    await page.getByRole('button', { name: 'Sign Out' }).click()

    await expect(page.getByText('Not signed in')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('sends unauthenticated users to the OIDC login entrypoint', async ({ page }) => {
    await mockControlPlane(page, { authenticated: false })
    await page.goto('/approvals')

    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page).toHaveURL(/\/api\/v1\/auth\/login\?returnTo=/)
    await expect(page.getByText('Mock OIDC Login')).toBeVisible()
  })

  test('switches cluster context and refreshes approval state', async ({ page }) => {
    await mockControlPlane(page)
    await page.goto('/approvals')

    await expect(page.getByText('Cluster primary')).toBeVisible()
    await expect(page.getByText('1 pending approvals')).toBeVisible()

    await page.locator('#cluster-switcher').selectOption('cluster-edge')

    await expect(page.getByText('Cluster edge')).toBeVisible()
    await expect(page.getByText('0 pending approvals')).toBeVisible()
    await expect(page.getByText('No pending approvals for this cluster.')).toBeVisible()
  })

  test('approves a guarded rollback and clears the pending queue', async ({ page }) => {
    await mockControlPlane(page)
    await page.goto('/approvals')

    await expect(page.getByText('Rollback the stalled frontend deployment.')).toBeVisible()
    await page.getByRole('button', { name: 'Approve' }).click()

    await expect(page.getByText('No pending approvals for this cluster.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Approvals \(0\)/ })).toBeVisible()
    await expect(page.getByText('Service rollback requested.')).toBeVisible()
  })

  test('streams cited assistant guidance and submits the proposal for approval', async ({
    page,
  }) => {
    await mockControlPlane(page)
    await page.goto('/assistant')

    await expect(page.getByText('No saved sessions for this cluster yet.')).toBeVisible()
    await page.getByRole('button', { name: 'What needs action right now?' }).click()

    await expect(page.getByText('Current Insight', { exact: true })).toBeVisible()
    await expect(page.getByText('Citations', { exact: true })).toBeVisible()
    await expect(page.getByText('Action Proposals', { exact: true })).toBeVisible()
    await expect(page.getByText('Rollback frontend to the last healthy spec')).toBeVisible()

    await page.getByRole('button', { name: 'Submit For Approval' }).click()

    await expect(
      page.getByText(
        'Rollback frontend to the last healthy spec: pending_approval · Action is pending admin approval.',
      ),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Approvals \(2\)/ })).toBeVisible()
  })

  test('resolves an incident from the incident command view', async ({ page }) => {
    await mockControlPlane(page)
    await page.goto('/incidents')

    await expect(page.getByText('1 open · 0 resolved')).toBeVisible()
    await expect(page.getByText('Frontend rollout paused')).toBeVisible()

    await page.getByRole('button', { name: '✓ Resolve' }).click()

    await expect(page.getByText('0 open · 1 resolved')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Resolved' })).toBeVisible()
  })
})
