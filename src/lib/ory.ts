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
  async logout(returnToUrl?: string) {
    try {
      // Create logout flow
      const { data } = await kratos.createBrowserLogoutFlow();

      // Redirect to the provided URL or default to login
      const returnTo = returnToUrl || (window.location.origin + "/login");
      const logoutUrl = new URL(data.logout_url);
      logoutUrl.searchParams.append("return_to", returnTo);

      console.log("Redirecting to Kratos logout:", logoutUrl.toString());
      window.location.href = logoutUrl.toString();
    } catch (error) {
      console.error("Failed to create logout flow:", error);
      // If flow creation fails, try fallback redirection
      if (returnToUrl) {
        window.location.href = returnToUrl;
      } else {
        window.location.href = "/login";
      }
    }
  },
};