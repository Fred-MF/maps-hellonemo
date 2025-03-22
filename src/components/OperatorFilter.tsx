import React from 'react';
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
  // Dédoublonner les opérateurs par ID
  const uniqueOperators = React.useMemo(() => {
    const operatorMap = new Map<string, Operator>();
    operators.forEach(operator => {
      if (!operatorMap.has(operator.id)) {
        operatorMap.set(operator.id, operator);
      }
    });
    return Array.from(operatorMap.values());
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
              <div className="font-medium">{operator.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OperatorFilter;