"use client";

import React, { useState } from 'react';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import Card from './Card';

interface AnalyteRow {
  name: string;
  value: number | string;
  unit: string | null;
  ref_low?: number | string | null;
  ref_high?: number | string | null;
}

interface ReviewTableProps {
  data: AnalyteRow[];
  onChange: (data: AnalyteRow[]) => void;
  className?: string;
}

export default function ReviewTable({ data, onChange, className = '' }: ReviewTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<AnalyteRow | null>(null);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingData({ ...data[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingData(null);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingData) {
      const newData = [...data];
      newData[editingIndex] = editingData;
      onChange(newData);
      setEditingIndex(null);
      setEditingData(null);
    }
  };

  const removeRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const addRow = () => {
    const newRow: AnalyteRow = {
      name: '',
      value: '',
      unit: '',
      ref_low: '',
      ref_high: '',
    };
    onChange([...data, newRow]);
  };

  const updateEditingData = (field: keyof AnalyteRow, value: string | number) => {
    if (editingData) {
      setEditingData({
        ...editingData,
        [field]: value,
      });
    }
  };

  const renderCell = (
    value: string | number | undefined,
    field: keyof AnalyteRow,
    index: number,
    isEditing: boolean
  ) => {
    if (isEditing && editingData) {
      return (
        <input
          type={field === 'name' || field === 'unit' ? 'text' : 'number'}
          value={editingData[field] || ''}
          onChange={(e) => updateEditingData(field, e.target.value)}
          className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          step={field === 'value' || field === 'ref_low' || field === 'ref_high' ? '0.1' : undefined}
        />
      );
    }

    return (
      <span className="text-sm text-slate-900">
        {value || <span className="text-slate-400">—</span>}
      </span>
    );
  };

  if (data.length === 0) {
    return (
      <Card className={`text-center py-8 ${className}`}>
        <div className="text-slate-500">
          <div className="text-lg font-medium mb-2">No lab results extracted</div>
          <div className="text-sm">Try uploading a different PDF or enter data manually below</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">Review & Edit Extracted Data</h3>
          <button
            onClick={addRow}
            className="px-3 py-1 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Add Row
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 text-sm font-medium text-slate-700">Analyte</th>
                <th className="pb-2 text-sm font-medium text-slate-700">Value</th>
                <th className="pb-2 text-sm font-medium text-slate-700">Unit</th>
                <th className="pb-2 text-sm font-medium text-slate-700">Ref Low</th>
                <th className="pb-2 text-sm font-medium text-slate-700">Ref High</th>
                <th className="pb-2 text-sm font-medium text-slate-700 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const isEditing = editingIndex === index;
                
                return (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      {renderCell(row.name, 'name', index, isEditing)}
                    </td>
                    <td className="py-3 pr-4">
                      {renderCell(row.value, 'value', index, isEditing)}
                    </td>
                    <td className="py-3 pr-4">
                      {renderCell(row.unit, 'unit', index, isEditing)}
                    </td>
                    <td className="py-3 pr-4">
                      {renderCell(row.ref_low, 'ref_low', index, isEditing)}
                    </td>
                    <td className="py-3 pr-4">
                      {renderCell(row.ref_high, 'ref_high', index, isEditing)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                              title="Save changes"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(index)}
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                              title="Edit row"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeRow(index)}
                              className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <strong>Note:</strong> Review all extracted values carefully. You can edit any field by clicking the pencil icon, 
          or add additional analytes using the &quot;Add Row&quot; button.
        </div>
      </div>
    </Card>
  );
}
