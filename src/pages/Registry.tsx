import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Pencil, Plus, Search, SearchX, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Database, Mail, Phone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { searchAllTeachers, searchAllStudents, getStudentById } from "@/lib/api";
import { searchAllEmployees, getEmployeeById } from "@/lib/employeeApi";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/layout/Sidebar";

type SortOrder = "asc" | "desc" | null;
type SortField = "created" | "updated" | null;

interface EntityData {
  id: string;
  name: string;
  email: string;
  instituteName: string;
  mobile?: string;
  created: string;
  updated: string;
  degree?: string;
  isAttested?: boolean;
}

const Registry = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("admin");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const recordsPerPage = 10;

  // View Sheet State
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleView = async (entity: EntityData) => {
    setIsViewOpen(true);
    setViewLoading(true);
    try {
      console.log("Fetching details for:", entity.id, "Role:", userRole);
      let details;

      // Dynamically fetch based on what we are listing
      if (userRole === "admin" || userRole === "employee") {
        // We are listing Employees
        details = await getEmployeeById(entity.id);
      } else if (userRole === "teacher") {
        // We are listing Students
        details = await getStudentById(entity.id);
      } else {
        // Fallback
        details = await getEmployeeById(entity.id);
      }

      console.log("Fetched details:", details);

      // Handle nested structure if present
      let cleanDetails = details;
      if (details.Employee) cleanDetails = details.Employee;
      else if (details.Student) cleanDetails = details.Student; // Student wrapper
      else if (details.result?.Employee) cleanDetails = details.result.Employee;
      else if (details.result?.Student) cleanDetails = details.result.Student;

      setSelectedEntity(cleanDetails);
    } catch (error) {
      console.error("Error fetching details:", error);
      toast({
        title: "Error",
        description: "Failed to load details",
        variant: "destructive"
      });
    } finally {
      setViewLoading(false);
    }
  };


  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin";
    setUserRole(role);

    console.log('👤 Current User Role:', role);

    // Fetch entities based on role
    if (role === "admin") {
      fetchEmployees();
    } else if (role === "teacher") {
      fetchStudents();
    }
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      console.log('📡 Fetching employees from registry...');
      const response = await searchAllEmployees();

      console.log('🔍 Raw API Response:', response);

      // Handle the various ways Sunbird RC can return data
      // Based on provided JSON: { "totalCount": 7, "data": [...] }
      let employeesArray = [];
      if (Array.isArray(response)) {
        employeesArray = response;
      } else if (response && typeof response === 'object') {
        // High priority for the 'data' property as per user JSON
        const listData = response.data || response.Employee || response.result || response.content;

        if (Array.isArray(listData)) {
          employeesArray = listData;
        } else if (listData && typeof listData === 'object' && Array.isArray(listData.content)) {
          employeesArray = listData.content;
        } else if (response.osid) {
          employeesArray = [response];
        }
      }

      console.log('✅ Extracted employees array:', employeesArray);
      console.log('✅ Count:', employeesArray.length);

      // Transform API response to EntityData format
      // Handle both schemas: nested (identityDetails/contactDetails) and flat (firstName/email)
      const employeeData: EntityData[] = employeesArray.map((employee: any) => {
        // Nested schema fields
        const nestedName = employee.identityDetails?.fullName;
        const nestedEmail = employee.contactDetails?.email;
        const nestedMobile = employee.contactDetails?.mobile;
        const nestedEmpNum = employee.identityDetails?.employeeNumber;

        // Flat schema fields
        const flatName = employee.firstName && employee.lastName
          ? `${employee.firstName} ${employee.lastName}`.trim()
          : employee.name;
        const flatEmail = employee.email;
        const flatMobile = employee.phoneNumber || employee.mobile;
        const flatEmpNum = employee.employeeNumber;

        return {
          id: employee.osid || employee.id,
          name: nestedName || flatName || 'N/A',
          email: nestedEmail || flatEmail || 'N/A',
          instituteName: (nestedEmpNum || flatEmpNum) ? `Emp #${nestedEmpNum || flatEmpNum}` : employee.instituteName || 'N/A',
          mobile: nestedMobile || flatMobile,
          created: employee.osCreatedAt || employee.createdAt || new Date().toISOString(),
          updated: employee.osUpdatedAt || employee.updatedAt || new Date().toISOString(),
        };
      });

      setEntities(employeeData);
    } catch (error) {
      toast({
        title: t("toast.failed_load_employees") || "Failed to load employees",
        description: error instanceof Error ? error.message : t("toast.could_not_fetch_employees") || "Could not fetch employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const response = await searchAllTeachers();

      // Handle response structure - could be array or object with data property
      const teachersArray = Array.isArray(response) ? response : (response.data || []);

      // Transform API response to EntityData format
      const teacherData: EntityData[] = teachersArray.map((teacher: any) => ({
        id: teacher.osid,
        name: teacher.name,
        email: teacher.email,
        instituteName: teacher.instituteName,
        mobile: teacher.mobile,
        created: teacher.osCreatedAt,
        updated: teacher.osUpdatedAt,
      }));

      setEntities(teacherData);
    } catch (error) {
      toast({
        title: t("toast.failed_load_teachers"),
        description: error instanceof Error ? error.message : t("toast.could_not_fetch_teachers"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await searchAllStudents();

      // Handle response structure - could be array or object with data property
      const studentsArray = Array.isArray(response) ? response : (response.data || []);

      // Transform API response to EntityData format
      const studentData: EntityData[] = studentsArray.map((student: any) => ({
        id: student.osid,
        name: student.fullName,
        email: student.email,
        instituteName: student.instituteName,
        mobile: student.mobile,
        created: student.osCreatedAt,
        updated: student.osUpdatedAt,
        degree: student.degree,
        isAttested: student.studentInstituteAttest && student.studentInstituteAttest.length > 0,
      }));

      setEntities(studentData);
    } catch (error) {
      toast({
        title: t("toast.failed_load_students"),
        description: error instanceof Error ? error.message : t("toast.could_not_fetch_students"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search query from URL parameters
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch = entity.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Sort entities if sort field is set
  const sortedEntities = [...filteredEntities].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    const dateA = new Date(a[sortField]).getTime();
    const dateB = new Date(b[sortField]).getTime();

    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedEntities.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedEntities = sortedEntities.slice(startIndex, startIndex + recordsPerPage);

  const toggleSort = (field: "created" | "updated") => {
    if (sortField === field) {
      // Cycle through: desc -> asc -> null
      if (sortOrder === "desc") setSortOrder("asc");
      else if (sortOrder === "asc") {
        setSortOrder(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: "created" | "updated") => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === "desc") return <ArrowDown className="h-4 w-4" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const handleDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEntities(entities.filter((entity) => entity.id !== deleteId));
      toast({
        title: t("toast.entity_deleted"),
        description: t("toast.record_removed"),
        variant: "success",
      });
      setDeleteId(null);
      setCurrentPage(1);
      setIsDeleting(false);
    }
  };

  const addButtonText = userRole === "admin" ? t("Add Employee") || "Add Employee" : t("btn.add_student");
  const pageTitle = userRole === "admin" ? t("List of Employees") || "Employee Management" : t("title.student_management");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-card border border-purple-200 flex items-center justify-center shadow-sm">
            <Database className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={userRole === "admin" ? t("search employees") || "Search employees..." : t("placeholder.search_students")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card font-medium rounded-lg h-11 border-input"
            />
          </div>
          <Button onClick={() => navigate("/entity/new")} className="gap-2 font-semibold rounded-lg h-11">
            <Plus className="h-4 w-4" />
            {addButtonText}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border/60">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
              <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-primary/10"></div>
              <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground animate-pulse">
              Syncing with Registry...
            </p>
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent overflow-hidden">
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5">
                <SearchX className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{t("no_data.no_records")}</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                {searchQuery
                  ? t("no_data.no_match_criteria")
                  : t("no_data.no_entities_available")}
              </p>
              {searchQuery && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <SearchX className="mr-2 h-4 w-4" />
                  {t("action.clear_filters")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
            <Table className="relative">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-secondary/95 backdrop-blur-sm border-b border-border/60">
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.name")}</TableHead>
                  {userRole === "teacher" && (
                    <>
                      <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("form.institute_name")}</TableHead>
                      <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("form.degree")}</TableHead>
                    </>
                  )}
                  {/* {userRole === "admin" && (
                  <TableHead className="font-bold text-foreground">{t("form.institute_name")}</TableHead>
                )} */}
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">
                    <button
                      onClick={() => toggleSort("created")}
                      className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                    >
                      {t("table.created_on")}
                      {getSortIcon("created")}
                    </button>
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">
                    <button
                      onClick={() => toggleSort("updated")}
                      className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                    >
                      {t("table.updated_on")}
                      {getSortIcon("updated")}
                    </button>
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider font-semibold text-muted-foreground">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntities.map((entity, i) => (
                  <TableRow key={entity.id} className={cn("transition-colors", i % 2 === 0 ? "bg-background" : "bg-muted/40", "hover:bg-muted/60")}>
                    <TableCell className="font-medium text-foreground">
                      {entity.name}
                    </TableCell>
                    {userRole === "teacher" && (
                      <>
                        <TableCell className="font-medium text-muted-foreground">
                          {entity.instituteName || "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {entity.degree ? (
                            <div className="flex items-center gap-2">
                              {entity.isAttested ? (
                                <Badge variant="default" className="gap-1">
                                  {/* <Shield className="h-3 w-3" /> */}
                                  {entity.degree}
                                </Badge>
                              ) : (
                                <span className="text-foreground">
                                  {entity.degree}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </>
                    )}
                    {/* {userRole === "admin" && (
                    <TableCell className="font-medium">{entity.instituteName}</TableCell>
                  )} */}
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {formatDistanceToNow(new Date(entity.created), { addSuffix: true })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{new Date(entity.created).toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {formatDistanceToNow(new Date(entity.updated), { addSuffix: true })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{new Date(entity.updated).toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(entity)}
                                className="bg-secondary hover:bg-muted text-foreground hover:text-foreground transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("action.view")}</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/entity/${entity.id}/edit`)}
                                className="bg-secondary hover:bg-muted text-foreground hover:text-foreground transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("action.edit")}</TooltipContent>
                          </Tooltip>

                          {/* Delete button disabled for now */}
                          {/* <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(entity.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("action.delete")}</TooltipContent>
                        </Tooltip> */}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredEntities.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent className="gap-2">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 transition-all",
                        currentPage === page
                          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                          : "border-border hover:bg-primary/10 hover:border-primary hover:text-primary"
                      )}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all",
                      currentPage === totalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.are_you_sure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.delete_warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("btn.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("action.deleting")}
                </>
              ) : (
                t("action.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Employee Details</SheetTitle>
            <SheetDescription>
              Detailed profile view
            </SheetDescription>
          </SheetHeader>

          {viewLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : selectedEntity ? (
            <div className="mt-6 space-y-6">

              {/* Identity Header */}
              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <h3 className="font-bold text-lg mb-1">{selectedEntity.identityDetails?.fullName || "N/A"}</h3>
                <Badge variant="outline">{selectedEntity.systemDetails?.role || "Employee"}</Badge>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Employee ID</Label>
                    <p className="font-medium">{selectedEntity.identityDetails?.employeeNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                    <div className="mt-1">
                      {selectedEntity.employmentDetails?.status ? (
                        <Badge className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email Address</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedEntity.contactDetails?.email || "N/A"}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Mobile Number</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedEntity.contactDetails?.mobile || "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Joining Date</Label>
                    <p className="font-medium">
                      {selectedEntity.employmentDetails?.admissionDate ?
                        new Date(selectedEntity.employmentDetails.admissionDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Contract Ends</Label>
                    <p className="font-medium">
                      {selectedEntity.employmentDetails?.contractExpiration ?
                        new Date(selectedEntity.employmentDetails.contractExpiration).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No details available</div>
          )}
        </SheetContent>
      </Sheet>

    </DashboardLayout>
  );
};

export default Registry;
