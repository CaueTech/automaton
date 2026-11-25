import { useRef } from 'react';
import type { Automaton, AutomatonType } from '../core/types.ts';

interface AutomatonSidebarProps {
  automata: Automaton[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (tipo: AutomatonType) => void;
  onDelete: (id: string) => void;
  onExport: (automaton: Automaton) => void;
  onImport: (jsonText: string) => void;
  onResetPresets: () => void;
  importError: string | null;
}

export function AutomatonSidebar({
  automata,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onExport,
  onImport,
  onResetPresets,
  importError,
}: AutomatonSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selected = automata.find((a) => a.id === selectedId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImport(reader.result);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <aside className="sidebar" aria-label="Gerenciador de autômatos">
      <div className="sidebar-header">
        <h2>Autômatos</h2>
        <span className="sidebar-count" title="Salvos automaticamente no navegador">
          {automata.length}
        </span>
      </div>

      <div className="sidebar-create-group">
        <button
          id="btn-new-afd"
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onCreate('AFD')}
        >
          + Novo AFD
        </button>
        <button
          id="btn-new-afn"
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onCreate('AFN')}
        >
          + Novo AFN
        </button>
      </div>

      <ul className="automaton-list" role="listbox" aria-label="Lista de autômatos salvos">
        {automata.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <li key={item.id} className={`automaton-item ${isSelected ? 'selected' : ''}`}>
              <button
                type="button"
                className="automaton-item-btn"
                onClick={() => onSelect(item.id)}
                aria-selected={isSelected}
              >
                <span className={`type-badge type-${item.tipo.toLowerCase()}`}>{item.tipo}</span>
                <span className="automaton-item-name">{item.nome}</span>
              </button>
              {automata.length > 1 && (
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  title={`Excluir ${item.nome}`}
                  aria-label={`Excluir ${item.nome}`}
                  onClick={() => onDelete(item.id)}
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="sidebar-actions">
        <button
          id="btn-export-json"
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!selected}
          onClick={() => selected && onExport(selected)}
        >
          Exportar JSON
        </button>
        <button
          id="btn-import-json"
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Importar JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={handleFileChange}
        />
        <button
          id="btn-reset-presets"
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onResetPresets}
          title="Restaura os modelos AFD e AFN do experimento (termina em 01)"
        >
          Restaurar experimento (01)
        </button>
      </div>

      {importError && (
        <div className="alert alert-error" role="alert">
          {importError}
        </div>
      )}

      <p className="sidebar-footnote">
        Alterações são salvas automaticamente no <code>localStorage</code> do navegador.
      </p>
    </aside>
  );
}
