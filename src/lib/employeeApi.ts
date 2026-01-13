import { getAuthToken } from './api';

const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string) || "";

// Auto-logout on 401 error
const handleUnauthorized = () => {
    console.warn("Unauthorized access (401). Token may be invalid or expired.");
    // localStorage.removeItem("accessToken");
    // localStorage.removeItem("isLoggedIn");
    // localStorage.removeItem("userEmail");
    // localStorage.removeItem("userRole");
    // window.location.href = "/login";
};

// Employee API Functions

// Search all Employees (Admin)
export const searchAllEmployees = async () => {
    const token = getAuthToken();

    const response = await fetch(`${BASE_URL}/registry/api/v1/Employee/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            filters: {},
        }),
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error("Failed to search employees");
    }

    const data = await response.json();
    return data;
};

// Search Employee by email
export const searchEmployeeByEmail = async (email: string) => {
    const token = getAuthToken();

    const response = await fetch(`${BASE_URL}/registry/api/v1/Employee/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            filters: {
                "contactDetails.email": {
                    eq: email,
                },
            },
        }),
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error("Failed to search employee");
    }

    const data = await response.json();
    return data;
};

// Get Employee by ID
export const getEmployeeById = async (osid: string) => {
    const token = getAuthToken();

    const response = await fetch(`${BASE_URL}/registry/api/v1/Employee/${osid}`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error("Failed to fetch employee details");
    }

    const data = await response.json();
    return data;
};

// Add Employee (Admin token)
export const addEmployee = async (employeeData: {
    identityDetails: {
        fullName: string;
        employeeNumber: string;
        personId?: number;
    };
    contactDetails: {
        email: string;
        mobile: string;
    };
    employmentDetails?: {
        employeeId?: number;
        companyId?: number;
        departmentId?: number;
        positionId?: number;
        employeeTypeId?: number;
        admissionDate?: string;
        contractExpiration?: string;
        salary?: number;
        status?: boolean;
    };
}) => {
    const token = getAuthToken();

    const response = await fetch(`${BASE_URL}/registry/api/v1/Employee`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error("Failed to add employee");
    }

    const data = await response.json();
    return data;
};

// Update Employee (Admin token)
export const updateEmployee = async (employeeId: string, employeeData: Partial<{
    identityDetails: {
        fullName?: string;
        employeeNumber?: string;
        personId?: number;
    };
    contactDetails: {
        email?: string;
        mobile?: string;
    };
    employmentDetails: {
        employeeId?: number;
        companyId?: number;
        departmentId?: number;
        positionId?: number;
        employeeTypeId?: number;
        admissionDate?: string;
        contractExpiration?: string;
        salary?: number;
        status?: boolean;
    };
}>) => {
    const token = getAuthToken();

    const response = await fetch(`${BASE_URL}/registry/api/v1/Employee/${employeeId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error("Failed to update employee");
    }

    const data = await response.json();
    return data;
};
