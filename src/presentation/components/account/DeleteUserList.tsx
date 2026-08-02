"use client";

import { useCallback, useEffect, useState } from "react";
import { authService } from "@/application/services/AuthService";
import type { AdminUserListItem } from "@/domain/entities/AdminUser";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import ResultDialog from "@/presentation/components/ui/ResultDialog";

/**
 * Halaman Delete User dengan tabel user non-admin dan aksi hapus.
 */
export default function DeleteUserList() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(
    null
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resultVariant, setResultVariant] = useState<"success" | "error" | null>(
    null
  );

  /**
   * Mengambil ulang daftar user non-admin dari database.
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    const result = await authService.listNonAdminUsers();

    if (result.success && result.users) {
      setUsers(result.users);
    } else {
      setUsers([]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Membuka dialog konfirmasi hapus untuk user yang dipilih.
   */
  function handleOpenDeleteConfirm(user: AdminUserListItem) {
    setSelectedUser(user);
    setShowConfirmDialog(true);
  }

  /**
   * Menutup dialog konfirmasi hapus.
   */
  function handleCloseConfirm() {
    setShowConfirmDialog(false);
    setSelectedUser(null);
  }

  /**
   * Menghapus user karyawan setelah konfirmasi.
   */
  async function handleConfirmDelete() {
    if (!selectedUser) {
      return;
    }

    setShowConfirmDialog(false);
    setIsLoading(true);

    const result = await authService.deleteUser({
      name: selectedUser.name,
      username: selectedUser.username,
    });

    setIsLoading(false);
    setSelectedUser(null);
    setResultVariant(result.success ? "success" : "error");
  }

  /**
   * Menutup dialog hasil dan me-refresh tabel user.
   */
  function handleCloseResult() {
    setResultVariant(null);
    fetchUsers();
  }

  return (
    <>
      <section className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">Delete User</h2>
          <p className="mt-2 text-sm text-slate-600">
            Daftar user dengan role karyawan yang dapat dihapus dari sistem.
          </p>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 md:px-6"
                  >
                    Nama
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 md:px-6"
                  >
                    Username
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-sm font-semibold text-slate-700 md:px-6"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-slate-500 md:px-6"
                    >
                      Tidak ada user yang dapat dihapus.
                    </td>
                  </tr>
                )}

                {users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 text-sm text-slate-900 md:px-6">
                      {user.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 md:px-6">
                      {user.username}
                    </td>
                    <td className="px-4 py-4 text-right md:px-6">
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteConfirm(user)}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ConfirmDialog
        visible={showConfirmDialog}
        message={
          selectedUser
            ? `Apakah Anda yakin akan menghapus User bernama ${selectedUser.name}?`
            : ""
        }
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />

      <ResultDialog
        visible={resultVariant === "success"}
        variant="success"
        message="Akun berhasil di hapus."
        onClose={handleCloseResult}
      />

      <ResultDialog
        visible={resultVariant === "error"}
        variant="error"
        message="Akun gagal di hapus."
        onClose={handleCloseResult}
      />

      <LoadingOverlay visible={isLoading} />
    </>
  );
}
