import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import { Loader2, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type { ShoppingItem, ShoppingList } from "@shared";

export default function ShoppingListView() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  const { data: activeMenu } = trpc.menus.getActive.useQuery(undefined, {
    retry: false,
  });
  const { data: shoppingList, isLoading } = trpc.shoppingLists.getByMenuId.useQuery(
    { weeklyMenuId: selectedListId || activeMenu?.id || 0 },
    { enabled: !!(selectedListId || activeMenu?.id), retry: false }
  );

  const updateShoppingList = trpc.shoppingLists.update.useMutation();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleToggleItem = async (index: number) => {
    if (!shoppingList) return;

    const updatedItems = [...shoppingList.items];
    updatedItems[index].checked = !updatedItems[index].checked;

    try {
      await updateShoppingList.mutateAsync({
        listId: shoppingList.id,
        items: updatedItems,
      });
      toast.success("Elemento actualizado");
    } catch (error) {
      toast.error("Error al actualizar elemento");
      console.error(error);
    }
  };

  const handleExportList = () => {
    if (!shoppingList) return;

    const grouped = shoppingList.items.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, ShoppingItem[]>
    );

    let text = "LISTA DE COMPRA\n";
    text += "===============\n\n";

    Object.entries(grouped).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      text += "-".repeat(category.length) + "\n";
      items.forEach((item) => {
        const checked = item.checked ? "✓" : "☐";
        text += `${checked} ${item.name} - ${item.quantity} ${item.unit}\n`;
      });
      text += "\n";
    });

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", "lista-compra.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Lista exportada correctamente");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shoppingList || !activeMenu) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
              ← Volver
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Listas de Compra</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-12 text-center">
              <p className="text-gray-600 mb-4">
                No tienes un menú activo. Crea uno primero para generar una lista de compra.
              </p>
              <Button
                onClick={() => navigate("/preferences")}
                className="bg-green-600 hover:bg-green-700"
              >
                Crear Menú
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Group items by category
  const grouped = shoppingList.items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, ShoppingItem[]>
  );

  const checkedCount = shoppingList.items.filter((item) => item.checked).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            ← Volver
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Listas de Compra</h1>
              <p className="text-gray-600 mt-1">
                {checkedCount} de {shoppingList.items.length} elementos comprados
              </p>
            </div>
            <Button
              onClick={handleExportList}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => {
                          const globalIndex = shoppingList.items.findIndex(
                            (i) => i.name === item.name && i.category === item.category
                          );
                          handleToggleItem(globalIndex);
                        }}
                      />
                      <div className="flex-1">
                        <p
                          className={`${
                            item.checked
                              ? "line-through text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {item.name}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} {item.unit}
                      </div>
                      {item.estimatedCost && (
                        <div className="text-sm font-semibold text-gray-900">
                          ${item.estimatedCost.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total de elementos:</span>
                <span className="font-semibold">{shoppingList.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Elementos comprados:</span>
                <span className="font-semibold text-green-600">{checkedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Elementos pendientes:</span>
                <span className="font-semibold text-orange-600">
                  {shoppingList.items.length - checkedCount}
                </span>
              </div>
              {shoppingList.items.some((item) => item.estimatedCost) && (
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span>Costo estimado:</span>
                  <span className="font-semibold">
                    $
                    {shoppingList.items
                      .reduce((sum, item) => sum + (item.estimatedCost || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
