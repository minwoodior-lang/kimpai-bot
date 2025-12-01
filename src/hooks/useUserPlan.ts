import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export type UserPlan = "free" | "pro";

interface UseUserPlanResult {
  plan: UserPlan;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

export function useUserPlan(): UseUserPlanResult {
  const [plan, setPlan] = useState<UserPlan>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUserPlan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setPlan("free");
          setIsAuthenticated(false);
          setUserId(null);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUserId(session.user.id);

        const { data: userProfile } = await supabase
          .from("users")
          .select("plan")
          .eq("id", session.user.id)
          .single();

        if (userProfile?.plan === "pro") {
          setPlan("pro");
        } else {
          setPlan("free");
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
        setPlan("free");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserPlan();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkUserPlan();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { plan, isLoading, isAuthenticated, userId };
}
