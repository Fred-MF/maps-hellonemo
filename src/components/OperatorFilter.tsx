import React, { useMemo } from 'react';
import { Operator } from '../types/api';
import { Bus } from 'lucide-react';

interface OperatorFilterProps {
  operators: Operator[];
  selectedOperator: Operator | null;
  onSelectOperator: (operator: Operator) => void;
}

const OperatorFilter: React.FC<OperatorFilterProps> = ({
  operators,
  selectedOperator,
  onSelectOperator
}) => {
  // Grouper les opérateurs par display_name
  const uniqueOperators = useMemo(() => {
    const operatorGroups = new Map<string, Operator[]>();
    
    operators
      .filter(operator => operator.is_active)
      .forEach(operator => {
        const key = operator.display_name || operator.name;
        if (!operatorGroups.has(key)) {
          operatorGroups.set(key, []);
        }
        operatorGroups.get(key)!.push(operator);
      });

    // Prendre le premier opérateur de chaque groupe comme représentant
    return Array.from(operatorGroups.values())
      .map(group => group[0])
      .sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name));
  }, [operators]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Opérateurs disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueOperators.map((operator) => (
          <button
            key={operator.id}
            onClick={() => onSelectOperator(operator)}
            className={`p-4 rounded-lg text-left transition-colors ${
              selectedOperator?.id === operator.id
                ? 'bg-purple-600 text-white'
                : 'bg-white hover:bg-purple-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <Bus className="h-5 w-5 mr-2" />
              <div className="font-medium">{operator.display_name || operator.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OperatorFilter;