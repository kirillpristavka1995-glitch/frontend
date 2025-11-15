import React, { useEffect, useRef, useState } from "react";

type JsonSchemaType =
  | "Object"
  | "Array"
  | "String"
  | "Number"
  | "Integer"
  | "Boolean"
  | "Null";

export const Sidebar: React.FC = () => {
  // ---------------------------------------------
  // Sidebar refs и состояние
  // ---------------------------------------------
  const asideRef = useRef<HTMLDivElement | null>(null);

  const [schemas, setSchemas] = useState<string[]>([]);
  const [openSchemas, setOpenSchemas] = useState(false);

  const [properties, setProperties] = useState<Record<string, string[]>>({});
  const [openProperties, setOpenProperties] = useState<Record<string, boolean>>(
    {}
  );

  // ---------------------------------------------
  // Контекстное меню: раздел "Справочники"
  // ---------------------------------------------
  const [rootContextMenu, setRootContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Модалка создания схемы
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [newSchemaName, setNewSchemaName] = useState("");

  // ---------------------------------------------
  // Контекстное меню: конкретная схема
  // ---------------------------------------------
  const [schemaContextMenu, setSchemaContextMenu] = useState<{
    x: number;
    y: number;
    schema: string;
  } | null>(null);

  // Модалка создания поля
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldSchemaName, setFieldSchemaName] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<JsonSchemaType | "ref">("String");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [refList, setRefList] = useState<string[]>([]);
  const [refValue, setRefValue] = useState("");

  // ---------------------------------------------
  // Глобальный обработчик закрытия меню
  // ---------------------------------------------
  useEffect(() => {
    const closeMenus = () => {
      setRootContextMenu(null);
      setSchemaContextMenu(null);
    };
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  // ---------------------------------------------
  // Загрузка всех схем
  // ---------------------------------------------
  const reloadSchemas = async () => {
    try {
      const response = await fetch("http://localhost:5253/api/schemas");
      const data: string[] = await response.json();
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

  // ---------------------------------------------
  // Загрузка списка полей схемы
  // ---------------------------------------------
  const reloadProperties = async (schema: string) => {
    try {
      const response = await fetch(
        `http://localhost:5253/api/schemas/${schema}/properties`
      );
      const data = await response.json();
      setProperties((prev) => ({
        ...prev,
        [schema]: Object.keys(data),
      }));
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

  // ---------------------------------------------
  // Создание новой схемы
  // ---------------------------------------------
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

  // ---------------------------------------------
  // Создание поля
  // ---------------------------------------------
  const openAddFieldModal = async (schema: string) => {
    setFieldSchemaName(schema);

    try {
      const response = await fetch("http://localhost:5253/api/schemas");
      const data: string[] = await response.json();
      setRefList(data);
    } catch {
      console.error("Ошибка загрузки ref-списка");
    }

    setSchemaContextMenu(null);
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
      console.error("Ошибка создания поля");
    }
  };

  // ---------------------------------------------
  // Рендер
  // ---------------------------------------------
  return (
    <aside
      ref={asideRef}
      className="w-64 bg-white shadow-lg p-4 flex flex-col gap-2 relative"
    >
      <h2 className="text-xl font-semibold mb-4">Меню</h2>

      {/* Справочники */}
      <button
        onClick={toggleSchemas}
        onContextMenu={(e) => {
          e.preventDefault();
          const rect = asideRef.current!.getBoundingClientRect();
          setRootContextMenu({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }}
        className="text-left p-2 rounded-lg hover:bg-gray-200 transition flex justify-between select-none"
      >
        <span>Справочники</span>
        <span>{openSchemas ? "▲" : "▼"}</span>
      </button>

      {/* --- Контекстное меню Справочники --- */}
      {rootContextMenu && (
        <div
          className="absolute bg-white border shadow-lg rounded-md z-50 py-1"
          style={{
            top: rootContextMenu.y,
            left: rootContextMenu.x,
          }}
        >
          <button
            onClick={() => {
              setRootContextMenu(null);
              setShowSchemaModal(true);
            }}
            className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
          >
            ➕ Добавить справочник
          </button>
        </div>
      )}

      {/* --- Дерево схем --- */}
      {openSchemas && (
        <div className="ml-4 mt-1 flex flex-col gap-1">
          {schemas.map((schema) => (
            <div key={schema}>
              <div
                onClick={() => toggleProperties(schema)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const rect = asideRef.current!.getBoundingClientRect();
                  setSchemaContextMenu({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    schema,
                  });
                }}
                className="p-2 text-sm rounded hover:bg-gray-100 cursor-pointer flex justify-between select-none"
              >
                📁 {schema}
                <span>{openProperties[schema] ? "▲" : "▼"}</span>
              </div>

              {openProperties[schema] && (
                <div className="ml-4 mt-1 flex flex-col gap-1">
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

      {/* --- Контекстное меню схемы --- */}
      {schemaContextMenu && (
        <div
          className="absolute bg-white border shadow-lg rounded-md z-50 py-1"
          style={{
            top: schemaContextMenu.y,
            left: schemaContextMenu.x,
          }}
        >
          <button
            onClick={() => openAddFieldModal(schemaContextMenu.schema)}
            className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
          >
            ➕ Добавить поле
          </button>
        </div>
      )}

      {/* ======================== МОДАЛКИ ========================= */}

      {/* --- Модалка создания схемы --- */}
      {showSchemaModal && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Новый справочник</h3>

            <input
              value={newSchemaName}
              onChange={(e) => setNewSchemaName(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              placeholder="Имя справочника"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={createSchema}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Модалка создания поля --- */}
      {showFieldModal && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">
              Добавить поле в «{fieldSchemaName}»
            </h3>

            {/* Имя поля */}
            <input
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full border rounded p-2 mb-3"
              placeholder="Имя поля"
            />

            {/* Тип */}
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

            {/* Required только если не ref */}
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

            {/* Выбор ref схемы */}
            {fieldType === "ref" && (
              <select
                value={refValue}
                onChange={(e) => setRefValue(e.target.value)}
                className="w-full border rounded p-2 mb-3"
              >
                <option value="">— Выберите схему —</option>
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
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={addField}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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