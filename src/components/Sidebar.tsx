import React, { useEffect, useRef, useState } from "react";

type JsonSchemaType =
  | "Object"
  | "Array"
  | "String"
  | "Number"
  | "Integer"
  | "Boolean"
  | "Null";

interface SidebarProps {
  onOpenSchema: (schemaName: string, schemaJson: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSchema }) => {
  const asideRef = useRef<HTMLDivElement | null>(null);

  // ================== DATA ==================
  const [schemas, setSchemas] = useState<string[]>([]);
  const [openSchemas, setOpenSchemas] = useState(false);

  const [properties, setProperties] = useState<Record<string, string[]>>({});
  const [openProperties, setOpenProperties] = useState<Record<string, boolean>>(
    {}
  );

  // ================== CONTEXT MENUS ==================
  const [rootMenu, setRootMenu] = useState<{ x: number; y: number } | null>(
    null
  );

  const [schemaMenu, setSchemaMenu] = useState<{
    x: number;
    y: number;
    schema: string;
  } | null>(null);

  // ================== MODALS ==================
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [newSchemaName, setNewSchemaName] = useState("");

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldSchemaName, setFieldSchemaName] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<JsonSchemaType | "ref">("String");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [refList, setRefList] = useState<string[]>([]);
  const [refValue, setRefValue] = useState("");

  // ================== CLOSE MENUS WHEN CLICK OUTSIDE ==================
  useEffect(() => {
    const close = () => {
      setRootMenu(null);
      setSchemaMenu(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // ================== LOAD SCHEMAS ==================
  const reloadSchemas = async () => {
    try {
      const res = await fetch("http://localhost:5253/api/schemas");
      const data: string[] = await res.json();
      setSchemas(data);
    } catch {
      console.error("Ошибка загрузки списка схем");
    }
  };

  const toggleSchemas = async () => {
    const next = !openSchemas;
    setOpenSchemas(next);
    if (next && schemas.length === 0) {
      await reloadSchemas();
    }
  };

  // ================== LOAD PROPERTIES ==================
  const reloadProperties = async (schema: string) => {
    try {
      const res = await fetch(
        `http://localhost:5253/api/schemas/${schema}/properties`
      );
      const data = await res.json();
      setProperties((prev) => ({ ...prev, [schema]: Object.keys(data) }));
    } catch {
      console.error("Ошибка загрузки свойств схемы");
    }
  };

  const toggleProperties = async (schema: string) => {
    const next = !openProperties[schema];
    setOpenProperties((prev) => ({ ...prev, [schema]: next }));
    if (next) {
      await reloadProperties(schema);
    }
  };

  // ================== CREATE NEW SCHEMA ==================
  const createSchema = async () => {
    if (!newSchemaName.trim()) return;

    try {
      await fetch("http://localhost:5253/api/schemas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSchemaName }),
      });

      setShowSchemaModal(false);
      setNewSchemaName("");
      await reloadSchemas();
    } catch {
      console.error("Ошибка создания схемы");
    }
  };

  // ================== CREATE NEW FIELD ==================
  const openAddFieldModal = async (schema: string) => {
    setFieldSchemaName(schema);

    try {
      const res = await fetch("http://localhost:5253/api/schemas");
      setRefList(await res.json());
    } catch {
      console.error("Ошибка загрузки списка схем для ref");
    }

    setSchemaMenu(null);
    setShowFieldModal(true);
  };

  const addField = async () => {
    if (!fieldName.trim()) return;

    const payload = {
      fieldName,
      type: fieldType === "ref" ? null : fieldType,
      required: fieldType === "ref" ? false : fieldRequired,
      ref: fieldType === "ref" ? refValue : null,
    };

    try {
      await fetch(
        `http://localhost:5253/api/schemas/${fieldSchemaName}/fields`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      setShowFieldModal(false);
      setFieldName("");
      setRefValue("");

      await reloadProperties(fieldSchemaName);
    } catch {
      console.error("Ошибка добавления поля");
    }
  };

  // ================== OPEN SCHEMA IN WORKSPACE (DOUBLE CLICK) ==================
  const openSchemaInWorkspace = async (schema: string) => {
    try {
      const res = await fetch(`http://localhost:5253/api/schemas/${schema}`);
      const schemaJson = await res.json();
      onOpenSchema(schema, schemaJson);
    } catch {
      console.error("Ошибка загрузки JSON схемы");
    }
  };

  // ================== RENDER ==================
  return (
    <aside
      ref={asideRef}
      className="w-64 bg-white shadow-lg p-4 flex flex-col gap-2 relative"
    >
      <h2 className="text-xl font-semibold mb-4">Меню</h2>

      {/* ================= Справочники ================= */}
      <button
        onClick={toggleSchemas}
        onContextMenu={(e) => {
          e.preventDefault();
          const rect = asideRef.current!.getBoundingClientRect();
          setRootMenu({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }}
        className="text-left p-2 rounded-lg hover:bg-gray-200 transition select-none"
      >
        Справочники
      </button>

      {/* Контекстное меню для Справочников */}
      {rootMenu && (
        <div
          className="absolute bg-white border shadow-lg rounded-md z-50 py-1"
          style={{ top: rootMenu.y, left: rootMenu.x }}
        >
          <button
            onClick={() => {
              setRootMenu(null);
              setShowSchemaModal(true);
            }}
            className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
          >
            ➕ Добавить справочник
          </button>
        </div>
      )}

      {/* ================= Список схем ================= */}
      {openSchemas && (
        <div className="ml-4 mt-1 flex flex-col gap-1">
          {schemas.map((schema) => (
            <div key={schema} className="flex flex-col">
              {/* Узел схемы */}
              <div
                className="flex items-center gap-2 p-2 text-sm rounded hover:bg-gray-100 cursor-pointer select-none"
                onDoubleClick={() => openSchemaInWorkspace(schema)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const rect = asideRef.current!.getBoundingClientRect();
                  setSchemaMenu({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    schema,
                  });
                }}
              >
                {/* Иконка раскрытия / сворачивания */}
                <span
                  className="cursor-pointer select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProperties(schema);
                  }}
                >
                  {openProperties[schema] ? "📂" : "📁"}
                </span>

                {/* Название схемы */}
                <span>{schema}</span>
              </div>

              {/* Поля схемы */}
              {openProperties[schema] && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {(properties[schema] ?? []).map((prop) => (
                    <div
                      key={prop}
                      className="p-1 text-xs rounded hover:bg-gray-100 cursor-pointer"
                    >
                      🔹 {prop}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Контекстное меню схемы */}
      {schemaMenu && (
        <div
          className="absolute bg-white border shadow-lg rounded-md z-50 py-1"
          style={{ top: schemaMenu.y, left: schemaMenu.x }}
        >
          <button
            onClick={() => openAddFieldModal(schemaMenu.schema)}
            className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
          >
            ➕ Добавить поле
          </button>
        </div>
      )}

      {/* ==================== Модалка: новая схема ==================== */}
      {showSchemaModal && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white shadow-lg rounded-xl p-6 w-80">
            <h3 className="text-lg font-medium mb-4">
              Новый справочник
            </h3>

            <input
              value={newSchemaName}
              onChange={(e) => setNewSchemaName(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              placeholder="Имя справочника"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Отмена
              </button>
              <button
                onClick={createSchema}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Модалка: новое поле ==================== */}
      {showFieldModal && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white shadow-lg rounded-xl p-6 w-80">
            <h3 className="text-lg font-medium mb-4">
              Новое поле в «{fieldSchemaName}»
            </h3>

            <input
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full border rounded p-2 mb-3"
              placeholder="Имя поля"
            />

            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as any)}
              className="w-full border rounded p-2 mb-3"
            >
              <option value="Object">Object</option>
              <option value="Array">Array</option>
              <option value="String">String</option>
              <option value="Number">Number</option>
              <option value="Integer">Integer</option>
              <option value="Boolean">Boolean</option>
              <option value="Null">Null</option>
              <option value="ref">Ref → другая схема</option>
            </select>

            {fieldType !== "ref" && (
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                />
                Required
              </label>
            )}

            {fieldType === "ref" && (
              <select
                value={refValue}
                onChange={(e) => setRefValue(e.target.value)}
                className="w-full border rounded p-2 mb-3"
              >
                <option value="">— выберите схему —</option>
                {refList.map((r) => (
                  <option key={r} value={`${r}.json`}>
                    {r}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFieldModal(false)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Отмена
              </button>
              <button
                onClick={addField}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};