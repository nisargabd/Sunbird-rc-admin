import { Configuration, FrontendApi } from '@ory/client';

const kratosConfig = new Configuration({
  basePath: import.meta.env.VITE_ORY_KRATOS_PUBLIC,
  baseOptions: {
    withCredentials: true,
  },
});

export const kratos = new FrontendApi(kratosConfig);

export const oryService = {
  // Initialize login flow
  async initLoginFlow() {
    const { data } = await kratos.createBrowserLoginFlow({
      refresh: true,
    });
    return data;
  },

  // Submit login
  async submitLogin(flowId: string, email: string, password: string, csrfToken: string) {
    const { data } = await kratos.updateLoginFlow({
      flow: flowId,
      updateLoginFlowBody: {
        method: 'password',
        password,
        identifier: email,
        csrf_token: csrfToken,
      },
    });
    return data;
  },

  // Get session
  async getSession() {
    try {
      const { data } = await kratos.toSession();
      return data;
    } catch (error) {
      return null;
    }
  },

  // Logout
  async logout() {
    const { data } = await kratos.createBrowserLogoutFlow();
    window.location.href = data.logout_url;
  },
};