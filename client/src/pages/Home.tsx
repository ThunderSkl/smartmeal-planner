import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useNavigate } from "react-router-dom";
import { ChefHat, Leaf, TrendingUp, ShoppingCart } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">SmartMeal Planner</h1>
            </div>
            <Button onClick={() => (window.location.href = getLoginUrl())}>
              Iniciar Sesión
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Planes de Comida Personalizados con IA
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Genera menús semanales equilibrados adaptados a tus preferencias dietéticas, alergias y objetivos nutricionales en segundos.
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Comenzar Ahora
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card>
              <CardHeader className="pb-3">
                <ChefHat className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Menús Personalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Genera menús semanales adaptados a tus preferencias y restricciones dietéticas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Leaf className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Restricciones Dietéticas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Soporta vegano, vegetariano, sin gluten, keto, paleo y más.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Objetivos Nutricionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Alcanza tus metas de pérdida de peso, ganancia muscular o mantenimiento.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <ShoppingCart className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Lista de Compra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Genera automáticamente listas de compra basadas en tu menú.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Cómo Funciona
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-lg">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Configura Preferencias</h4>
                <p className="text-gray-600">
                  Indica tus alergias, restricciones dietéticas y objetivos nutricionales.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-lg">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">IA Genera Menú</h4>
                <p className="text-gray-600">
                  Nuestra IA crea un menú semanal equilibrado y delicioso en segundos.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-lg">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Compra y Disfruta</h4>
                <p className="text-gray-600">
                  Obtén tu lista de compra y comienza a preparar tus comidas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-8">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2024 SmartMeal Planner. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">SmartMeal Planner</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Bienvenido, {user?.name || "Usuario"}</span>
            <Button variant="outline" onClick={() => logout()}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Menú</CardTitle>
              <CardDescription>
                Genera un nuevo menú semanal personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate("/preferences")}
              >
                Comenzar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mis Menús</CardTitle>
              <CardDescription>
                Ver y gestionar tus menús generados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate("/menus")}
              >
                Ver Menús
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferencias</CardTitle>
              <CardDescription>
                Actualiza tus preferencias dietéticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate("/preferences")}
              >
                Editar Preferencias
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listas de Compra</CardTitle>
              <CardDescription>
                Accede a tus listas de compra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate("/shopping")}
              >
                Ver Listas
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
