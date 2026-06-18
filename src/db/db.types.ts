export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      ActitityTypes: {
        Row: {
          createdAt: string;
          createdBy: string;
          icon: string;
          id: number;
          name: string;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          createdAt: string;
          createdBy: string;
          icon: string;
          id: number;
          name: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          createdAt?: string;
          createdBy?: string;
          icon?: string;
          id?: number;
          name?: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [];
      };
      Activities: {
        Row: {
          businessId: number | null;
          clientId: number | null;
          createdAt: string;
          createdBy: string;
          entity: string | null;
          entityId: number | null;
          id: number;
          title: string;
          typeId: number;
        };
        Insert: {
          businessId?: number | null;
          clientId?: number | null;
          createdAt: string;
          createdBy: string;
          entity?: string | null;
          entityId?: number | null;
          id: number;
          title: string;
          typeId: number;
        };
        Update: {
          businessId?: number | null;
          clientId?: number | null;
          createdAt?: string;
          createdBy?: string;
          entity?: string | null;
          entityId?: number | null;
          id?: number;
          title?: string;
          typeId?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'activities_businessid_fkey';
            columns: ['businessId'];
            isOneToOne: false;
            referencedRelation: 'Businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activities_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
        ];
      };
      Appointments: {
        Row: {
          accountName: string;
          clientId: number | null;
          clientSquareId: string;
          createdAt: string;
          createdBy: string;
          creatorType: string;
          durationMinutes: number;
          endAt: string;
          id: number;
          service: string;
          squareId: string | null;
          staffId: number;
          startAt: string;
          status: string;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          accountName: string;
          clientId?: number | null;
          clientSquareId: string;
          createdAt: string;
          createdBy: string;
          creatorType: string;
          durationMinutes: number;
          endAt: string;
          id: number;
          service: string;
          squareId?: string | null;
          staffId: number;
          startAt: string;
          status: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          accountName?: string;
          clientId?: number | null;
          clientSquareId?: string;
          createdAt?: string;
          createdBy?: string;
          creatorType?: string;
          durationMinutes?: number;
          endAt?: string;
          id?: number;
          service?: string;
          squareId?: string | null;
          staffId?: number;
          startAt?: string;
          status?: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
        ];
      };
      Businesses: {
        Row: {
          address: string;
          city: string;
          createdAt: string;
          createdBy: string;
          ein: string;
          establishedAt: string;
          id: number;
          name: string;
          state: string;
          typeId: number;
          updatedAt: string | null;
          updatedBy: string | null;
          zipCode: string;
        };
        Insert: {
          address: string;
          city: string;
          createdAt: string;
          createdBy: string;
          ein: string;
          establishedAt: string;
          id: number;
          name: string;
          state: string;
          typeId: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
          zipCode: string;
        };
        Update: {
          address?: string;
          city?: string;
          createdAt?: string;
          createdBy?: string;
          ein?: string;
          establishedAt?: string;
          id?: number;
          name?: string;
          state?: string;
          typeId?: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
          zipCode?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'businesses_typeid_fkey';
            columns: ['typeId'];
            isOneToOne: false;
            referencedRelation: 'BusinessTypes';
            referencedColumns: ['id'];
          },
        ];
      };
      BusinessTypes: {
        Row: {
          createdAt: string;
          createdBy: string;
          id: number;
          name: string;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          createdAt: string;
          createdBy: string;
          id: number;
          name: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          createdAt?: string;
          createdBy?: string;
          id?: number;
          name?: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [];
      };
      ClientBusiness: {
        Row: {
          businessId: number;
          clientId: number;
          createdAt: string;
          createdBy: string;
          id: number;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          businessId: number;
          clientId: number;
          createdAt: string;
          createdBy: string;
          id: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          businessId?: number;
          clientId?: number;
          createdAt?: string;
          createdBy?: string;
          id?: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'clientbusiness_businessid_fkey';
            columns: ['businessId'];
            isOneToOne: false;
            referencedRelation: 'Businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clientbusiness_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
        ];
      };
      ClientRelatives: {
        Row: {
          clientId: number;
          createdAt: string;
          createdBy: string;
          id: number;
          relatedClientId: number;
          relationship: string;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          clientId: number;
          createdAt: string;
          createdBy: string;
          id: number;
          relatedClientId: number;
          relationship: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          clientId?: number;
          createdAt?: string;
          createdBy?: string;
          id?: number;
          relatedClientId?: number;
          relationship?: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'clientrelationships_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clientrelationships_relatedclientid_fkey';
            columns: ['relatedClientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
        ];
      };
      Clients: {
        Row: {
          address: string;
          city: string;
          createdAt: string;
          createdBy: string;
          dateOfBirth: string;
          firstName: string;
          flag: string | null;
          id: number;
          lastName: string;
          squareId: string | null;
          ssnLastFour: string;
          state: string;
          updatedAt: string | null;
          updatedBy: string | null;
          zipCode: number;
        };
        Insert: {
          address: string;
          city: string;
          createdAt?: string;
          createdBy: string;
          dateOfBirth: string;
          firstName: string;
          flag?: string | null;
          id: number;
          lastName: string;
          squareId?: string | null;
          ssnLastFour: string;
          state: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
          zipCode: number;
        };
        Update: {
          address?: string;
          city?: string;
          createdAt?: string;
          createdBy?: string;
          dateOfBirth?: string;
          firstName?: string;
          flag?: string | null;
          id?: number;
          lastName?: string;
          squareId?: string | null;
          ssnLastFour?: string;
          state?: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
          zipCode?: number;
        };
        Relationships: [];
      };
      Contacts: {
        Row: {
          businessId: number | null;
          clientId: number | null;
          contactType: string;
          contactValue: string;
          createdAt: string;
          createdBy: string;
          id: number;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          businessId?: number | null;
          clientId?: number | null;
          contactType: string;
          contactValue: string;
          createdAt: string;
          createdBy: string;
          id: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          businessId?: number | null;
          clientId?: number | null;
          contactType?: string;
          contactValue?: string;
          createdAt?: string;
          createdBy?: string;
          id?: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contacts_businessid_fkey';
            columns: ['businessId'];
            isOneToOne: false;
            referencedRelation: 'Businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
        ];
      };
      Logins: {
        Row: {
          businessId: number | null;
          clientId: number | null;
          createdAt: string;
          createdBy: string;
          id: number;
          label: string;
          note: string | null;
          password: string;
          updatedAt: string | null;
          updatedBy: string | null;
          url: string | null;
          username: string;
        };
        Insert: {
          businessId?: number | null;
          clientId?: number | null;
          createdAt?: string;
          createdBy: string;
          id?: number;
          label: string;
          note?: string | null;
          password: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
          url?: string | null;
          username: string;
        };
        Update: {
          businessId?: number | null;
          clientId?: number | null;
          createdAt?: string;
          createdBy?: string;
          id?: number;
          label?: string;
          note?: string | null;
          password?: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
          url?: string | null;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'logins_businessid_fkey';
            columns: ['businessId'];
            isOneToOne: false;
            referencedRelation: 'Businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'logins_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
        ];
      };
      Logs: {
        Row: {
          createdAt: string;
          eventId: string;
          eventType: string;
          id: number;
          message: string;
          payload: Json;
          statusCode: number | null;
        };
        Insert: {
          createdAt?: string;
          eventId: string;
          eventType: string;
          id?: number;
          message: string;
          payload: Json;
          statusCode?: number | null;
        };
        Update: {
          createdAt?: string;
          eventId?: string;
          eventType?: string;
          id?: number;
          message?: string;
          payload?: Json;
          statusCode?: number | null;
        };
        Relationships: [];
      };
      Notes: {
        Row: {
          businessId: number | null;
          clientId: number | null;
          content: string;
          createdAt: string;
          createdBy: string;
          id: number;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          businessId?: number | null;
          clientId?: number | null;
          content: string;
          createdAt: string;
          createdBy: string;
          id: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          businessId?: number | null;
          clientId?: number | null;
          content?: string;
          createdAt?: string;
          createdBy?: string;
          id?: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_businessid_fkey';
            columns: ['businessId'];
            isOneToOne: false;
            referencedRelation: 'Businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
        ];
      };
      ProvidedServices: {
        Row: {
          businessId: number | null;
          clientId: number | null;
          createdAt: string;
          createdBy: string;
          id: number;
          serviceId: number;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          businessId?: number | null;
          clientId?: number | null;
          createdAt?: string;
          createdBy: string;
          id?: number;
          serviceId: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          businessId?: number | null;
          clientId?: number | null;
          createdAt?: string;
          createdBy?: string;
          id?: number;
          serviceId?: number;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'providedservices_businessid_fkey';
            columns: ['businessId'];
            isOneToOne: false;
            referencedRelation: 'Businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'providedservices_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'providedservices_serviceid_fkey';
            columns: ['serviceId'];
            isOneToOne: false;
            referencedRelation: 'Services';
            referencedColumns: ['id'];
          },
        ];
      };
      Services: {
        Row: {
          createdAt: string;
          createdBy: string;
          id: number;
          isActive: number;
          name: string | null;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          createdAt: string;
          createdBy: string;
          id: number;
          isActive: number;
          name?: string | null;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          createdAt?: string;
          createdBy?: string;
          id?: number;
          isActive?: number;
          name?: string | null;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [];
      };
      Staff: {
        Row: {
          createdAt: string;
          createdBy: string;
          email: string | null;
          firstName: string;
          id: number;
          lastName: string;
          squareId: string | null;
          status: string;
          title: string;
          updatedAt: string | null;
          updatedBy: string | null;
          userId: string | null;
        };
        Insert: {
          createdAt: string;
          createdBy: string;
          email?: string | null;
          firstName: string;
          id: number;
          lastName: string;
          squareId?: string | null;
          status: string;
          title: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
          userId?: string | null;
        };
        Update: {
          createdAt?: string;
          createdBy?: string;
          email?: string | null;
          firstName?: string;
          id?: number;
          lastName?: string;
          squareId?: string | null;
          status?: string;
          title?: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
          userId?: string | null;
        };
        Relationships: [];
      };
      Tasks: {
        Row: {
          businessId: number | null;
          clientId: number | null;
          content: string;
          createdAt: string;
          createdBy: string;
          id: number;
          staffId: number;
          status: string;
          updatedAt: string | null;
          updatedBy: string | null;
        };
        Insert: {
          businessId?: number | null;
          clientId?: number | null;
          content: string;
          createdAt: string;
          createdBy: string;
          id: number;
          staffId: number;
          status: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Update: {
          businessId?: number | null;
          clientId?: number | null;
          content?: string;
          createdAt?: string;
          createdBy?: string;
          id?: number;
          staffId?: number;
          status?: string;
          updatedAt?: string | null;
          updatedBy?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_businessid_fkey';
            columns: ['businessId'];
            isOneToOne: false;
            referencedRelation: 'Businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_clientid_fkey';
            columns: ['clientId'];
            isOneToOne: false;
            referencedRelation: 'Clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_staffid_fkey';
            columns: ['staffId'];
            isOneToOne: false;
            referencedRelation: 'Staff';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
