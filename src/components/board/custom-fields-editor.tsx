"use client";

import React, { useState, useEffect } from "react";
import { CustomField, CustomFieldValue, useUpdateCustomValue } from "@/hooks/use-omnitask";
import { cn } from "@/lib/utils";
import { Hash, Type, Calendar as CalendarIcon, DollarSign, List } from "lucide-react";

interface CustomFieldsEditorProps {
  cardId: string;
  fields: CustomField[];
  values: CustomFieldValue[];
}

export function CustomFieldsEditor({ cardId, fields, values }: CustomFieldsEditorProps) {
  if (fields.length === 0) return null;

  // Remove duplicates by ID just in case
  const uniqueFields = fields.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Campos Customizados</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {uniqueFields.map((field) => (
          <FieldInput 
            key={field.id}
            cardId={cardId}
            field={field}
            initialValue={values.find(v => v.customFieldId === field.id)?.value || ""}
          />
        ))}
      </div>
    </div>
  );
}

interface FieldInputProps {
  cardId: string;
  field: CustomField;
  initialValue: string;
}

function FieldInput({ cardId, field, initialValue }: FieldInputProps) {
  const [value, setValue] = useState(initialValue);
  const updateValueMutation = useUpdateCustomValue(cardId);

  // Update local state if initialValue changes (e.g. from server)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (value !== initialValue) {
      updateValueMutation.mutate({ customFieldId: field.id, value });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLElement).blur();
    }
  };

  const Icon = getFieldIcon(field.type);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 ml-1 text-muted-foreground">
        <Icon size={12} />
        <span className="text-[11px] font-bold uppercase">{field.name}</span>
      </div>
      
      {field.type === "DROPDOWN" ? (
        <select
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            updateValueMutation.mutate({ customFieldId: field.id, value: e.target.value });
          }}
          className="w-full bg-accent/30 border border-border/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
        >
          <option value="">Selecionar...</option>
          {JSON.parse(field.options || "[]").map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === "DATE" ? (
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-accent/30 border border-border/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      ) : (
        <input
          type={field.type === "NUMBER" || field.type === "CURRENCY" ? "number" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={`Digite...`}
          className="w-full bg-accent/30 border border-border/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      )}
    </div>
  );
}

function getFieldIcon(type: string) {
  switch (type) {
    case "NUMBER": return Hash;
    case "TEXT": return Type;
    case "DATE": return CalendarIcon;
    case "CURRENCY": return DollarSign;
    case "DROPDOWN": return List;
    default: return Type;
  }
}
