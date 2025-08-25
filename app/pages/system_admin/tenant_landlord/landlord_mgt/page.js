"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../../../../../zustand/authStore";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    TableSortLabel,
    CircularProgress,
    Button,
} from "@mui/material";
import { Eye } from "lucide-react";
import LoadingScreen from "../../../../../components/loadingScreen";
import axios from "axios";
import Swal from "sweetalert2";

export default function LandlordList() {
    const [landlords, setLandlords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const { fetchSession, user, admin } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        const fetchLandlords = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/systemadmin/users/getAllLandlords");

                if (!response.ok) {
                     new Error("Failed to fetch landlords.");
                }
                const data = await response.json();
                setLandlords(data.landlords);

            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLandlords();
        }, []);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };


    const handleSuspend = async (userId, email) => {
        const { isConfirmed } = await Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to suspend this account?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, suspend it!",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
        });
        if (!isConfirmed) return;

        const { value: formValues } = await Swal.fire({
            title: "Additional Details",
            html:
                `<input 
          id="swal-input1" 
          type="email" 
          placeholder="Email" 
          class="swal2-input" 
          value="${email}" 
        />` +
                `<textarea 
          id="swal-input2" 
          placeholder="Message (optional)" 
          class="swal2-textarea"
        ></textarea>`,
            focusConfirm: false,
            preConfirm: () => {
                const emailInput = document.getElementById("swal-input1").value;
                const message = document.getElementById("swal-input2").value;
                if (!emailInput) {
                    Swal.showValidationMessage("Email is required.");
                    return;
                }
                return { email: emailInput, message };
            },
            showCancelButton: true,
            confirmButtonText: "Submit",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
        });

        if (!formValues) return;

        try {
            await axios.post(`/api/systemadmin/users/suspendAccounts`, {
                userId,
                email: formValues.email,
                message: formValues.message,
            });

            await Swal.fire({
                title: "Suspended!",
                text: "Account has been suspended.",
                icon: "success",
            });
        } catch (error) {
            console.error("Error suspending account:", error);
            await Swal.fire({
                title: "Error!",
                text: "Failed to suspend account. Please try again.",
                icon: "error",
            });
        }
    };
    const filteredAndSortedLandlords = landlords
        .filter(
            (landlord) =>
                landlord.user_id.toString().includes(searchTerm) ||
                landlord.is_verified.toString().includes(searchTerm) ||
                new Date(landlord.createdAt).toLocaleDateString().includes(searchTerm)
        )
        .sort((a, b) => {
            if (!sortConfig.key) return 0;

            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });

    if (error) return <p className="text-red-500 p-6">Error: {error}</p>;

    if (loading) {
        return <LoadingScreen />;
    }

    if (!admin) {
        return <p className="text-red-500 p-6">You need to log in to access the dashboard.</p>;
    }

    return (
        <div className="flex">
            <SideNavAdmin />

            <div className="flex-1 p-6 max-w-6xl mx-auto">
                <h1 className="text-2xl font-semibold text-blue-600 mb-6">Landlords List</h1>

                {/* Search Bar */}
                <TextField
                    label="Search landlords..."
                    variant="outlined"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />

                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {[
                                        { key: "landlord_id", label: "ID" },
                                        { key: "user_id", label: "User ID" },
                                        { key: "email", label: "Email" },
                                        { key: "is_verified", label: "Verified" },
                                        { key: "createdAt", label: "Created At" },
                                        { key: "actions", label: "Actions" },
                                    ].map((column) => (
                                        <TableCell key={column.key} align="center">
                                            {column.key !== "actions" ? (
                                                <TableSortLabel
                                                    active={sortConfig.key === column.key}
                                                    direction={sortConfig.key === column.key ? sortConfig.direction : "asc"}
                                                    onClick={() => requestSort(column.key)}
                                                >
                                                    {column.label}
                                                </TableSortLabel>
                                            ) : (
                                                column.label
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filteredAndSortedLandlords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No landlords found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedLandlords.map((landlord, index) => (
                                        <TableRow key={landlord?.landlord_id} hover>
                                            <TableCell align="center">{index + 1}</TableCell>
                                            <TableCell
                                                align="center"
                                                className="text-blue-600 hover:underline cursor-pointer"
                                                onClick={() => router.push(`./viewProfile/landlord/${landlord?.user_id}`)}
                                            >
                                                {landlord?.user_id}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                className="text-blue-600 hover:underline cursor-pointer"
                                                onClick={() => router.push(`./viewProfile/landlord/${landlord?.user_id}`)}
                                            >
                                                {landlord?.email}
                                            </TableCell>
                                            <TableCell align="center">
                                                {landlord?.is_verified ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            ✅ Yes
                          </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            ❌ No
                          </span>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {new Date(landlord?.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => router.push(`./viewProfile/landlord/${landlord?.user_id}`)}
                                                    startIcon={<Eye size={16} />}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    size="small"
                                                    onClick={() => handleSuspend(landlord?.user_id, landlord?.email)}
                                                    style={{ marginLeft: '8px' }}
                                                >
                                                    Suspend Account
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </div>
        </div>
    );
}
