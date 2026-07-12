import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Button from '../../ui/WButton';
import WInput from '../../ui/WInput';
import Text from '../../ui/Text';
import { WeeCard, WeeModalShell } from '../../ui/wee';
import { ActionCommand, QuickAccessItem } from '../app-library';
import {
  ADMIN_ACTION_CATEGORIES,
  ADMIN_POWER_ACTIONS_CATALOG,
  CUSTOM_ACTION_ICONS,
  executeAdminCommand,
  isDestructiveAdminAction,
  normalizeAdminPanelConfig,
  validateAdminCommand,
} from '../../utils/adminPanelCommands';
import { useUIState } from '../../utils/useConsolidatedAppHooks';

const EMPTY_CUSTOM = {
  name: '',
  command: '',
  icon: '⚙️',
  category: 'Custom',
};

function AdminPanel({ isOpen, onClose, onSave, config }) {
  const { confirmAction } = useUIState();
  const normalized = normalizeAdminPanelConfig(config);
  const [powerActions, setPowerActions] = useState(normalized.powerActions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [banner, setBanner] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState(null);
  const [customAction, setCustomAction] = useState(EMPTY_CUSTOM);
  const [customActionError, setCustomActionError] = useState('');
  const [runFeedback, setRunFeedback] = useState(null);

  const powerActionsRef = useRef(powerActions);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    powerActionsRef.current = powerActions;
  }, [powerActions]);

  useEffect(() => {
    if (isOpen && !hasInitializedRef.current) {
      setPowerActions(normalizeAdminPanelConfig(config).powerActions);
      hasInitializedRef.current = true;
      setBanner(null);
      setRunFeedback(null);
      setShowCustomForm(false);
      setEditingCustomId(null);
      setCustomAction(EMPTY_CUSTOM);
      setSearchQuery('');
      setSelectedCategory('All');
    }
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [config, isOpen]);

  const showBanner = useCallback((message, tone = 'success') => {
    setBanner({ message, tone });
    window.setTimeout(() => setBanner(null), 2800);
  }, []);

  const customActions = useMemo(
    () => powerActions.filter((action) => action.category === 'Custom'),
    [powerActions]
  );

  const allActions = useMemo(
    () => [...ADMIN_POWER_ACTIONS_CATALOG, ...customActions],
    [customActions]
  );

  const filteredActions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allActions.filter((action) => {
      const matchesSearch =
        !q ||
        action.name.toLowerCase().includes(q) ||
        action.id.toLowerCase().includes(q) ||
        String(action.command || '').toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || action.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allActions, searchQuery, selectedCategory]);

  const commandValidation = useMemo(
    () => validateAdminCommand(customAction.command),
    [customAction.command]
  );

  const handleAddAction = useCallback(
    (action) => {
      const currentActions = powerActionsRef.current;
      const existing =
        action.category === 'Custom'
          ? currentActions.find((pa) => pa.name.toLowerCase() === action.name.toLowerCase())
          : currentActions.find((pa) => pa.id === action.id);
      if (existing) return;

      setPowerActions([...currentActions, action]);
      setRecentlyAdded(action.id);
      showBanner(`Added “${action.name}”`);
      window.setTimeout(() => setRecentlyAdded(null), 1800);
    },
    [showBanner]
  );

  const handleRemoveAction = useCallback((actionId) => {
    setPowerActions(powerActionsRef.current.filter((pa) => pa.id !== actionId));
  }, []);

  const handleToggleCatalogAction = useCallback(
    (action) => {
      const currentActions = powerActionsRef.current;
      const existing = currentActions.find((pa) => pa.id === action.id);
      if (existing) {
        handleRemoveAction(action.id);
        showBanner(`Removed “${action.name}”`, 'neutral');
        return;
      }
      handleAddAction(action);
    },
    [handleAddAction, handleRemoveAction, showBanner]
  );

  const handleMoveAction = useCallback((fromIndex, toIndex) => {
    const currentActions = powerActionsRef.current;
    const newActions = [...currentActions];
    const [movedAction] = newActions.splice(fromIndex, 1);
    newActions.splice(toIndex, 0, movedAction);
    setPowerActions(newActions);
  }, []);

  const handleSave = useCallback(() => {
    onSave(powerActionsRef.current.map((action) => ({ ...action })));
    onClose();
  }, [onSave, onClose]);

  const runCommand = useCallback(
    async (action) => {
      setRunFeedback(null);
      const result = await executeAdminCommand(action.command);
      if (!result.success) {
        setRunFeedback({
          tone: 'error',
          message: result.error || `Could not run “${action.name}”`,
        });
        return false;
      }
      setRunFeedback({ tone: 'success', message: `Ran “${action.name}”` });
      return true;
    },
    []
  );

  const handleQuickExecute = useCallback(
    (action) => {
      if (isDestructiveAdminAction(action)) {
        confirmAction(
          `Run ${action.name}?`,
          `This will run <strong>${action.name}</strong> on your PC. Continue?`,
          () => {
            void runCommand(action);
          },
          null,
          'Run',
          'danger-primary'
        );
        return;
      }
      void runCommand(action);
    },
    [confirmAction, runCommand]
  );

  const openEditCustom = useCallback((action) => {
    setEditingCustomId(action.id);
    setCustomAction({
      name: action.name,
      command: action.command,
      icon: action.icon || '⚙️',
      category: 'Custom',
    });
    setShowCustomForm(true);
    setCustomActionError('');
  }, []);

  const handleSubmitCustomAction = useCallback(() => {
    setCustomActionError('');
    if (!customAction.name.trim()) {
      setCustomActionError('Give this action a short name');
      return;
    }
    if (!customAction.command.trim()) {
      setCustomActionError('Enter a command');
      return;
    }
    const gate = validateAdminCommand(customAction.command.trim());
    if (!gate.ok) {
      setCustomActionError(gate.error || 'Command is not allowlisted');
      return;
    }

    const name = customAction.name.trim();
    const command = customAction.command.trim();
    const duplicate = powerActionsRef.current.find(
      (pa) =>
        pa.name.toLowerCase() === name.toLowerCase() &&
        pa.id !== editingCustomId
    );
    if (duplicate) {
      setCustomActionError('An action with this name already exists');
      return;
    }

    if (editingCustomId) {
      setPowerActions(
        powerActionsRef.current.map((pa) =>
          pa.id === editingCustomId
            ? { ...pa, name, command, icon: customAction.icon, category: 'Custom' }
            : pa
        )
      );
      showBanner(`Updated “${name}”`);
    } else {
      const newCustomAction = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name,
        command,
        icon: customAction.icon,
        category: 'Custom',
      };
      setPowerActions([...powerActionsRef.current, newCustomAction]);
      setRecentlyAdded(newCustomAction.id);
      showBanner(`Added “${name}”`);
      window.setTimeout(() => setRecentlyAdded(null), 1800);
    }

    setCustomAction(EMPTY_CUSTOM);
    setShowCustomForm(false);
    setEditingCustomId(null);
  }, [customAction, editingCustomId, showBanner]);

  const handleCancelCustomAction = useCallback(() => {
    setCustomAction(EMPTY_CUSTOM);
    setShowCustomForm(false);
    setEditingCustomId(null);
    setCustomActionError('');
  }, []);

  return (
    <WeeModalShell
      isOpen={isOpen}
      headerTitle="Configure Quick Access"
      onClose={onClose}
      showRail={false}
      maxWidth="1200px"
      footerContent={({ handleClose }) => (
        <div className="flex w-full items-center justify-between gap-3">
          <Text variant="caption" className="text-[hsl(var(--text-tertiary))]">
            {powerActions.length} action{powerActions.length === 1 ? '' : 's'} in your menu
          </Text>
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save menu
            </Button>
          </div>
        </div>
      )}
    >
      {banner ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            banner.tone === 'success'
              ? 'border-[hsl(var(--state-success)/0.45)] bg-[hsl(var(--state-success)/0.12)] text-[hsl(var(--state-success))]'
              : 'border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))]'
          }`}
          role="status"
        >
          {banner.message}
        </div>
      ) : null}

      {runFeedback ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            runFeedback.tone === 'error'
              ? 'border-[hsl(var(--state-error)/0.45)] bg-[hsl(var(--state-error)/0.1)] text-[hsl(var(--state-error))]'
              : 'border-[hsl(var(--state-success)/0.45)] bg-[hsl(var(--state-success)/0.12)] text-[hsl(var(--state-success))]'
          }`}
          role="status"
        >
          {runFeedback.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-5 lg:h-[min(620px,70vh)] lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <WeeCard
            title="Browse actions"
            separator
            desc="Tap to add or remove. Run to try safely before saving."
            className="mb-3 shrink-0"
          />

          <div className="mb-3 space-y-3">
            <WInput
              placeholder="Search by name or command…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {['All', ...ADMIN_ACTION_CATEGORIES].map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${
                      active
                        ? 'border-[hsl(var(--primary)/0.55)] bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--primary))]'
                        : 'border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.5)] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {!showCustomForm ? (
            <div className="mb-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCustomForm(true);
                  setEditingCustomId(null);
                  setCustomAction(EMPTY_CUSTOM);
                  setCustomActionError('');
                }}
                fullWidth
              >
                + Custom action
              </Button>
            </div>
          ) : (
            <div className="mb-3 rounded-2xl border border-[hsl(var(--border-primary)/0.5)] bg-[hsl(var(--surface-secondary)/0.55)] p-4">
              <Text variant="body" className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]">
                {editingCustomId ? 'Edit custom action' : 'New custom action'}
              </Text>
              <div className="mb-3 space-y-3">
                <WInput
                  label="Name"
                  placeholder="e.g. Calculator"
                  value={customAction.name}
                  onChange={(e) => setCustomAction((prev) => ({ ...prev, name: e.target.value }))}
                />
                <WInput
                  label="Command"
                  placeholder="e.g. start calc"
                  value={customAction.command}
                  onChange={(e) => {
                    setCustomAction((prev) => ({ ...prev, command: e.target.value }));
                    if (customActionError) setCustomActionError('');
                  }}
                />
                {customAction.command.trim() ? (
                  <Text
                    variant="caption"
                    className={
                      commandValidation.ok
                        ? 'text-[hsl(var(--state-success))]'
                        : 'text-[hsl(var(--state-warning))]'
                    }
                  >
                    {commandValidation.ok
                      ? commandValidation.destructive
                        ? 'Will run (asks for confirmation — power action)'
                        : 'Looks good — this command is allowlisted'
                      : commandValidation.error}
                  </Text>
                ) : (
                  <Text variant="caption" className="text-[hsl(var(--text-tertiary))]">
                    Use <code className="font-mono text-[11px]">start notepad</code>,{' '}
                    <code className="font-mono text-[11px]">start ms-settings:sound</code>, or a{' '}
                    <code className="font-mono text-[11px]">.cpl</code> /{' '}
                    <code className="font-mono text-[11px]">.msc</code> tool. Free-form scripts are not allowed.
                  </Text>
                )}
                <div>
                  <Text variant="caption" className="mb-2 block text-[hsl(var(--text-tertiary))]">
                    Icon
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {CUSTOM_ACTION_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setCustomAction((prev) => ({ ...prev, icon }))}
                        className={`rounded-xl px-2.5 py-2 text-xl transition-colors ${
                          customAction.icon === icon
                            ? 'border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.14)]'
                            : 'border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary))]'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {customActionError ? (
                <div className="mb-3 rounded-xl border border-[hsl(var(--state-error)/0.45)] bg-[hsl(var(--state-error)/0.1)] px-3 py-2 text-sm text-[hsl(var(--state-error))]">
                  {customActionError}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Button variant="primary" onClick={handleSubmitCustomAction}>
                  {editingCustomId ? 'Save changes' : 'Add to menu'}
                </Button>
                <Button variant="secondary" onClick={handleCancelCustomAction}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.35)] p-2">
            {filteredActions.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[hsl(var(--text-tertiary))]">
                No actions match that search.
              </div>
            ) : (
              filteredActions.map((action) => {
                const isAdded = Boolean(powerActions.find((pa) => pa.id === action.id));
                return (
                  <ActionCommand
                    key={action.id}
                    action={action}
                    isAdded={isAdded}
                    isRecentlyAdded={recentlyAdded === action.id}
                    onAdd={handleToggleCatalogAction}
                    onRemove={handleRemoveAction}
                    onQuickExecute={handleQuickExecute}
                    onEdit={action.category === 'Custom' ? openEditCustom : undefined}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <WeeCard
            title="Your menu"
            separator
            desc="Drag to reorder. This is what shows on the floating widget."
            className="mb-3 shrink-0"
          />
          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.45)] p-2">
            {powerActions.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm italic text-[hsl(var(--text-tertiary))]">
                Pick a few favorites from the left — keep it light and useful.
              </div>
            ) : (
              powerActions.map((action, index) => (
                <QuickAccessItem
                  key={action.id}
                  action={action}
                  index={index}
                  onRemove={handleRemoveAction}
                  onMoveAction={handleMoveAction}
                  onEdit={action.category === 'Custom' ? openEditCustom : undefined}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </WeeModalShell>
  );
}

export default AdminPanel;
