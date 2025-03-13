const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/VisualizerPage.vue') }
    ]
  }
]

export default routes
