import { useState } from "react";
import { Sidebar } from "./components/Sidebar";

export default function App() {
  const [currentSchema, setCurrentSchema] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]); // данные таблицы
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const handleOpenSchema = (name: string, schema: any) => {
    setCurrentSchema(schema);
    setRecords([]); // очищаем таблицу при смене схемы
  };

  const handleAddRecord = () => {
    setFormData({});
    setShowModal(true);
  };

  const handleSaveRecord = () => {
    setRecords((prev) => [...prev, formData]);
    setShowModal(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onOpenSchema={handleOpenSchema} />

      <div className="w-px bg-gray-300" />

      <main className="flex-1 overflow-auto p-6">
        {currentSchema ? (
          <>
            <button
              onClick={handleAddRecord}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
              ➕ Добавить запись
            </button>

            <SchemaTable schema={currentSchema} records={records} />

            {showModal && (
              <RecordModal
                schema={currentSchema}
                formData={formData}
                setFormData={setFormData}
                onClose={() => setShowModal(false)}
                onSave={handleSaveRecord}
              />
            )}
          </>
        ) : (
          <div className="text-gray-500 text-lg">Рабочая область</div>
        )}
      </main>
    </div>
  );
}

function SchemaTable({ schema, records }: { schema: any; records: any[] }) {
  const columns = Object.keys(schema.properties ?? {});
  const types = columns.map((c) => {
    const prop = schema.properties[c];
    return prop.type ?? (prop.$ref ? "ref" : "unknown");
  });

  return (
    <table className="min-w-full bg-white shadow rounded-lg border border-gray-200">
      <thead className="bg-gray-100 border-b border-gray-300">
        <tr>
          {columns.map((col, i) => (
            <th key={col} className="px-4 py-2 text-left font-medium text-gray-700">
              {col}
              <div className="text-xs text-gray-500">{types[i]}</div>
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {records.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-4 text-center text-gray-400"
            >
              Нет записей
            </td>
          </tr>
        ) : (
          records.map((row, idx) => (
            <tr key={idx} className="border-t">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2">
                  {row[col] ?? ""}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function RecordModal({
  schema,
  formData,
  setFormData,
  onClose,
  onSave,
}: {
  schema: any;
  formData: any;
  setFormData: (v: any) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const fields = Object.entries(schema.properties);

  const handleChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  const renderInput = (key: string, prop: any) => {
    // ref-поле
    if (prop.$ref) {
      return (
        <input
          type="text"
          placeholder="ref"
          value={formData[key] ?? ""}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full border rounded p-2"
        />
      );
    }

    switch (prop.type) {
      case "string":
        return (
          <input
            type="text"
            value={formData[key] ?? ""}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full border rounded p-2"
          />
        );

      case "number":
      case "integer":
        return (
          <input
            type="number"
            value={formData[key] ?? ""}
            onChange={(e) => handleChange(key, Number(e.target.value))}
            className="w-full border rounded p-2"
          />
        );

      case "boolean":
        return (
          <select
            value={formData[key] ?? ""}
            onChange={(e) => handleChange(key, e.target.value === "true")}
            className="w-full border rounded p-2"
          >
            <option value="">—</option>
            <option value="true">Да</option>
            <option value="false">Нет</option>
          </select>
        );

      case "object":
        return (
          <textarea
            value={formData[key] ?? ""}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full border rounded p-2"
            placeholder="JSON"
          />
        );

      default:
        return (
          <input
            type="text"
            value={formData[key] ?? ""}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full border rounded p-2"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white shadow-xl rounded-xl p-6 w-96">
        <h3 className="text-lg font-medium mb-4">Добавить запись</h3>

        <div className="flex flex-col gap-3">
          {fields.map(([key, prop]: any) => (
            <div key={key}>
              <label className="block text-sm mb-1 text-gray-700">{key}</label>
              {renderInput(key, prop)}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Отмена
          </button>

          <button
            onClick={onSave}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}