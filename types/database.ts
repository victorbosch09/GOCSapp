// Hand-written types matching supabase/migrations/*.sql.
// Regenerate with `supabase gen types typescript --linked` once the project
// is linked, if the schema drifts from this file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Rank = {
  id: string;
  name: string;
  abbreviation: string;
  weekly_wage: number;
  description: string | null;
  promotion_requirement: string | null;
  sort_order: number;
  created_at: string;
};

export type Profile = {
  id: string;
  callsign: string;
  squad: string | null;
  rank_id: string | null;
  is_command_staff: boolean;
  approved: boolean;
  join_date: string;
  avatar_url: string | null;
  cached_balance: number;
  created_at: string;
};

export type CatalogItem = {
  id: string;
  category: string;
  name: string;
  price: number;
  mag_price_standard: number | null;
  mag_price_special: number | null;
  capacity: string | null;
  in_stock: boolean;
  image_url: string | null;
  notes: string | null;
  created_at: string;
};

export type Vehicle = {
  id: string;
  category: string;
  name: string;
  price: number;
  in_stock: boolean;
  image_url: string | null;
  notes: string | null;
  created_at: string;
};

export type TransactionType =
  | "Sueldo"
  | "Bono"
  | "Compra Armamento"
  | "Compra Vehiculo"
  | "Descuento"
  | "Sancion"
  | "Ajuste Manual";

export type Transaction = {
  id: string;
  profile_id: string;
  type: TransactionType;
  detail: string | null;
  amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type ContractBonusType = {
  id: string;
  label: string;
  amount: number;
  sort_order: number;
};

export type ContractRiskLevel = {
  id: string;
  level: number;
  percentage: number;
  sort_order: number;
};

export type Contract = {
  id: string;
  profile_id: string;
  contract_date: string;
  risk_level: number | null;
  bonuses: Json;
  total_amount: number;
  logged_by: string | null;
  notes: string | null;
  created_at: string;
};

export type NotificationTarget = "all" | "profile" | "squad";

export type Notification = {
  id: string;
  title: string;
  body: string | null;
  target_type: NotificationTarget;
  target_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type Reward = {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  amount: number | null;
  awarded_by: string | null;
  awarded_at: string;
};

export type SanctionSeverity = "leve" | "moderada" | "grave" | "muy grave" | "extrema";

export type SanctionType = {
  id: string;
  severity: SanctionSeverity;
  label: string;
  description: string | null;
  sort_order: number;
};

export type Sanction = {
  id: string;
  profile_id: string;
  sanction_type_id: string | null;
  severity: SanctionSeverity;
  description: string | null;
  amount_deducted: number | null;
  applied_by: string | null;
  applied_at: string;
};

export type EventType = "entrenamiento" | "operacion" | "pago" | "otro";

export type Event = {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_at: string;
  end_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type PayrollRun = {
  id: string;
  run_at: string;
  triggered_by: string | null;
  profiles_paid: number;
  total_amount: number;
  status: "success" | "error";
  notes: string | null;
};

export type TeamOverview = {
  total_soldados_activos: number;
  nomina_semanal_total: number;
  gasto_total_armamento: number;
  gasto_total_vehiculos: number;
  proximos_eventos_count: number;
};

export type RosterEntry = {
  id: string;
  callsign: string;
  squad: string | null;
  join_date: string;
  avatar_url: string | null;
  is_command_staff: boolean;
  rank_name: string | null;
  rank_abbreviation: string | null;
  rank_sort_order: number | null;
};

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ViewDef<Row> = {
  Row: Row;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      ranks: TableDef<Rank, Partial<Rank>>;
      profiles: TableDef<Profile, Partial<Profile>>;
      weapons: TableDef<CatalogItem, Partial<CatalogItem>>;
      equipment: TableDef<CatalogItem, Partial<CatalogItem>>;
      accessories: TableDef<CatalogItem, Partial<CatalogItem>>;
      vehicles: TableDef<Vehicle, Partial<Vehicle>>;
      transactions: TableDef<Transaction, Partial<Transaction>>;
      contract_bonus_types: TableDef<ContractBonusType, Partial<ContractBonusType>>;
      contract_risk_levels: TableDef<ContractRiskLevel, Partial<ContractRiskLevel>>;
      contracts: TableDef<Contract, Partial<Contract>>;
      notifications: TableDef<Notification, Partial<Notification>>;
      rewards: TableDef<Reward, Partial<Reward>>;
      sanction_types: TableDef<SanctionType, Partial<SanctionType>>;
      sanctions: TableDef<Sanction, Partial<Sanction>>;
      events: TableDef<Event, Partial<Event>>;
      payroll_runs: TableDef<PayrollRun, Partial<PayrollRun>>;
    };
    Views: {
      team_overview: ViewDef<TeamOverview>;
      roster_public: ViewDef<RosterEntry>;
    };
    Functions: {
      purchase_item: {
        Args: { p_profile_id: string; p_item_table: string; p_item_id: string };
        Returns: Transaction;
      };
      run_weekly_payroll: {
        Args: { p_triggered_by: string | null };
        Returns: PayrollRun;
      };
      log_contract: {
        Args: {
          p_profile_ids: string[];
          p_risk_level: number | null;
          p_bonuses: Json;
          p_total_amount: number;
          p_logged_by: string;
          p_notes: string | null;
        };
        Returns: Contract[];
      };
    };
  };
};
