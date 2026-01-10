import { useState } from "react";
import { oryService } from '@/lib/ory';
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Fingerprint, Loader2, Eye, EyeOff, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const loginChallenge = searchParams.get('login_challenge');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);


  const handlePasswordVisibilityToggle = () => {
    setShowPassword(true);
    setTimeout(() => {
      setShowPassword(false);
    }, 1000);
  };

  const validateField = (fieldName: "email" | "password", value: string) => {
    if (fieldName === "email") {
      if (!value) {
        return "Username is required";
      }
    }

    if (fieldName === "password") {
      if (!value) {
        return "Password is required";
      }
    }

    return "";
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      try {
        if (loginChallenge) {
          // Initialize Kratos login flow
          const loginFlow = await oryService.initLoginFlow();

          // Extract CSRF token from the flow
          const csrfNode = loginFlow.ui.nodes.find((node: any) =>
            node.attributes?.name === "csrf_token"
          );
          const csrfToken = (csrfNode?.attributes as any)?.value as string;

          if (!csrfToken) {
            throw new Error("CSRF token not found. Please refresh and try again.");
          }

          // Submit credentials
          const session = await oryService.submitLogin(loginFlow.id, email, password, csrfToken);

          // Accept Hydra Challenge
          const acceptResponse = await fetch(
            `${import.meta.env.VITE_ORY_HYDRA_ADMIN || 'http://localhost:4445'}/admin/oauth2/auth/requests/login/accept?login_challenge=${loginChallenge}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subject: session.session.identity.id,
                remember: true,
                remember_for: 3600,
                context: {
                  email: email,
                  role: role,
                  name: session.session.identity.traits.name,
                },
              }),
            }
          );

          if (!acceptResponse.ok) {
             const errText = await acceptResponse.text();
             throw new Error('Failed to accept login challenge: ' + errText);
          }

          const acceptData = await acceptResponse.json();

          // Redirect
          window.location.href = acceptData.redirect_to;

        } else {
          // No login_challenge...
          const { oauth2Service } = await import('../lib/oauth2');
          oauth2Service.startAuthFlow();
        }
      } catch (error: any) {
        console.error('Login error:', error);
        toast({
          title: "❌ Login failed",
          description: error?.response?.data?.ui?.messages?.[0]?.text || error.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }
  };

  // ... (rest of the component)
  const isInitializingFlow = !loginChallenge;

  if (isInitializingFlow) {
    setTimeout(async () => {
      const { oauth2Service } = await import('../lib/oauth2');
      oauth2Service.startAuthFlow();
    }, 100);

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
          <h2 className="text-xl font-semibold">Connecting...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900">
      
      <div className="grid lg:grid-cols-2 gap-8 w-full max-w-4xl">
         {/* Info Side */}
         <div className="hidden lg:flex flex-col justify-center text-white space-y-6 p-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-lg text-cyan-100">
                Secure Authentication provided by Ory Kratos.
              </p>
            </div>
            
            <div className="space-y-4 text-sm text-cyan-200/80">
               <p>Please sign in to continue to <strong>EduTech Portal</strong>.</p>
            </div>
         </div>

        {/* Login Card */}
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mb-4">
                <Fingerprint className="h-8 w-8 text-cyan-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
              <p className="text-sm text-slate-500 mt-1">Use your Ory ID to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email / Username</Label>
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    const error = validateField("email", e.target.value);
                    setErrors(prev => ({ ...prev, email: error || undefined }));
                  }}
                  className={errors.email ? 'border-red-500' : 'focus-visible:ring-cyan-500'}
                  placeholder="admin"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      const error = validateField("password", e.target.value);
                      setErrors(prev => ({ ...prev, password: error || undefined }));
                    }}
                    className={errors.password ? 'border-red-500' : 'focus-visible:ring-cyan-500'}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={handlePasswordVisibilityToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600"
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-6 shadow-lg transform transition active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
