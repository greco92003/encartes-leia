"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPendingUsers, approveUser, AuthUser } from "@/lib/supabase-auth";

export function UserTable() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);

  // Carregar usuários pendentes
  useEffect(() => {
    async function loadUsers() {
      try {
        const pendingUsers = await getPendingUsers();
        setUsers(pendingUsers);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        toast.error("Erro ao carregar usuários pendentes.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  // Função para aprovar usuário
  async function handleApproveUser(userId: string) {
    setApprovingUser(userId);

    try {
      await approveUser(userId);

      // Atualizar lista de usuários
      setUsers(users.filter((user) => user.id !== userId));

      toast.success("Usuário aprovado com sucesso!");
    } catch (error) {
      console.error("Erro ao aprovar usuário:", error);
      toast.error("Erro ao aprovar usuário. Tente novamente.");
    } finally {
      setApprovingUser(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários Pendentes</CardTitle>
        <CardDescription>
          Aprove ou rejeite usuários que se cadastraram no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Não há usuários pendentes de aprovação.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {new Date(user.created_at || "").toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleApproveUser(user.id)}
                      disabled={approvingUser === user.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {approvingUser === user.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Aprovando...
                        </>
                      ) : (
                        "Aprovar"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
