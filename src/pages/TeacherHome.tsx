import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TeacherHome = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <GraduationCap className="h-8 w-8" />
          <span>EduTech Portal</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost">About</Button>
          <Button variant="ghost">Courses</Button>
          <Button onClick={handleLogin}>Teacher Login</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold text-slate-900 leading-tight">
              Manage Your Classroom <br />
              <span className="text-indigo-600">Without Limits</span>
            </h1>
            <p className="text-xl text-slate-600">
              The all-in-one platform for modern educators. Track student progress, manage credentials, and streamline your workflow.
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={handleLogin} className="text-lg px-8 bg-indigo-600 hover:bg-indigo-700 shadow-xl transition-transform active:scale-95">
                Login with Ory
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </div>


          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white shadow-lg translate-y-8">
              <CardHeader>
                <Users className="h-10 w-10 text-blue-500 mb-2" />
                <CardTitle>Students</CardTitle>
                <CardDescription>Manage 45+ Students</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-green-500 mb-2" />
                <CardTitle>Courses</CardTitle>
                <CardDescription>12 Active Courses</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white shadow-lg translate-y-8 col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Grade updates, Attendance, generated 2m ago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-2 w-full bg-slate-100 rounded mb-2" />
                <div className="h-2 w-2/3 bg-slate-100 rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherHome;
