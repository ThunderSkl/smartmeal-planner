import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function MenusView() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: menus, isLoading } = trpc.menus.list.useQuery({ limit: 20 });
  const { data: activeMenu } = trpc.menus.getActive.useQuery(undefined, {
    retry: false,
  });
  const setActiveMenu = trpc.menus.setActive.useMutation();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSetActive = async (menuId: number) => {
    try {
      await setActiveMenu.mutateAsync({ menuId });
      toast.success("Menú activado correctamente");
    } catch (error) {
      toast.error("Error al activar menú");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            ← Volver
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Mis Menús</h1>
            <Button
              onClick={() => navigate("/preferences")}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Menú
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!menus || menus.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <p className="text-gray-600 mb-4">No tienes menús generados aún</p>
              <Button
                onClick={() => navigate("/preferences")}
                className="bg-green-600 hover:bg-green-700"
              >
                Crear Primer Menú
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu: any) => (
              <Card
                key={menu.id}
                className={`cursor-pointer transition-all ${
                  activeMenu && activeMenu.id === menu.id ? "ring-2 ring-green-600" : ""
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    Menú del {format(new Date(menu.startDate), "d 'de' MMMM", { locale: es })}
                  </CardTitle>
                  <CardDescription>
                    {menu.isActive === 1 ? (
                      <span className="text-green-600 font-semibold">Menú Activo</span>
                    ) : (
                      <span>Menú Guardado</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="text-sm">
                      <p className="text-gray-600">Calorías diarias promedio:</p>
                      <p className="font-semibold">
                        {Math.round(menu.nutritionSummary.averageCaloriesPerDay)} kcal
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600">Proteína diaria:</p>
                      <p className="font-semibold">
                        {Math.round(menu.nutritionSummary.averageProteinPerDay)}g
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/menus/${menu.id}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      Ver Detalles
                    </Button>
                    {!activeMenu || activeMenu.id !== menu.id ? (
                      <Button
                        onClick={() => handleSetActive(menu.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={setActiveMenu.isPending}
                      >
                        Activar
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
