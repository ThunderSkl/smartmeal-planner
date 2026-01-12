import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const ALLERGIES = [
  "Cacahuetes",
  "Frutos secos",
  "Mariscos",
  "Pescado",
  "Huevos",
  "Lácteos",
  "Soja",
  "Trigo",
];

const DIETARY_RESTRICTIONS = [
  "Vegano",
  "Vegetariano",
  "Sin gluten",
  "Keto",
  "Paleo",
  "Sin lactosa",
];

const NUTRITIONAL_GOALS = [
  "Pérdida de peso",
  "Ganancia muscular",
  "Mantenimiento",
  "Rendimiento atlético",
];

const CUISINES = [
  "Mediterránea",
  "Asiática",
  "Mexicana",
  "Italiana",
  "India",
  "Francesa",
  "Americana",
];

export default function Preferences() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [nutritionalGoals, setNutritionalGoals] = useState<string[]>([]);
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [targetProtein, setTargetProtein] = useState(50);
  const [targetCarbs, setTargetCarbs] = useState(250);
  const [targetFat, setTargetFat] = useState(65);

  // Fetch existing preferences
  const { data: preferences } = trpc.preferences.get.useQuery();
  const updatePreferences = trpc.preferences.update.useMutation();
  const generateMenu = trpc.menu.generate.useMutation();

  useEffect(() => {
    if (preferences) {
      setAllergies(preferences.allergies || []);
      setDietaryRestrictions(preferences.dietaryRestrictions || []);
      setNutritionalGoals(preferences.nutritionalGoals || []);
      setPreferredCuisines(preferences.preferredCuisines || []);
      setTargetCalories(preferences.targetCalories || 2000);
      setTargetProtein(preferences.targetProtein || 50);
      setTargetCarbs(preferences.targetCarbs || 250);
      setTargetFat(preferences.targetFat || 65);
    }
  }, [preferences]);

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await updatePreferences.mutateAsync({
        allergies,
        dietaryRestrictions,
        nutritionalGoals,
        preferredCuisines,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
      });
      toast.success("Preferencias guardadas correctamente");
    } catch (error) {
      toast.error("Error al guardar preferencias");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMenu = async () => {
    setLoading(true);
    try {
      const result = await generateMenu.mutateAsync({
        numberOfDays: 7,
      });
      toast.success("Menú generado correctamente");
      navigate("/menus");
    } catch (error) {
      toast.error("Error al generar menú");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Mis Preferencias</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Allergies Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Alergias</CardTitle>
              <CardDescription>
                Selecciona los alimentos a los que eres alérgico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ALLERGIES.map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergy-${allergy}`}
                      checked={allergies.includes(allergy)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAllergies([...allergies, allergy]);
                        } else {
                          setAllergies(allergies.filter((a) => a !== allergy));
                        }
                      }}
                    />
                    <Label htmlFor={`allergy-${allergy}`} className="cursor-pointer">
                      {allergy}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dietary Restrictions Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Restricciones Dietéticas</CardTitle>
              <CardDescription>
                Selecciona tus restricciones dietéticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <div key={restriction} className="flex items-center space-x-2">
                    <Checkbox
                      id={`restriction-${restriction}`}
                      checked={dietaryRestrictions.includes(restriction)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setDietaryRestrictions([...dietaryRestrictions, restriction]);
                        } else {
                          setDietaryRestrictions(
                            dietaryRestrictions.filter((r) => r !== restriction)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`restriction-${restriction}`} className="cursor-pointer">
                      {restriction}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nutritional Goals Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Objetivos Nutricionales</CardTitle>
              <CardDescription>
                Selecciona tus objetivos de salud
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {NUTRITIONAL_GOALS.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal}`}
                      checked={nutritionalGoals.includes(goal)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNutritionalGoals([...nutritionalGoals, goal]);
                        } else {
                          setNutritionalGoals(
                            nutritionalGoals.filter((g) => g !== goal)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`goal-${goal}`} className="cursor-pointer">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preferred Cuisines Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cocinas Preferidas</CardTitle>
              <CardDescription>
                Selecciona tus tipos de cocina favoritos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CUISINES.map((cuisine) => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cuisine-${cuisine}`}
                      checked={preferredCuisines.includes(cuisine)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPreferredCuisines([...preferredCuisines, cuisine]);
                        } else {
                          setPreferredCuisines(
                            preferredCuisines.filter((c) => c !== cuisine)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`cuisine-${cuisine}`} className="cursor-pointer">
                      {cuisine}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nutritional Targets Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Objetivos Nutricionales Diarios</CardTitle>
              <CardDescription>
                Establece tus metas diarias de macronutrientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="calories">Calorías Diarias</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Proteína (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={targetProtein}
                    onChange={(e) => setTargetProtein(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbohidratos (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={targetCarbs}
                    onChange={(e) => setTargetCarbs(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Grasas (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={targetFat}
                    onChange={(e) => setTargetFat(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSavePreferences}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Guardando..." : "Guardar Preferencias"}
            </Button>
            <Button
              onClick={handleGenerateMenu}
              disabled={loading}
              variant="outline"
            >
              {loading ? "Generando..." : "Generar Menú Semanal"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
