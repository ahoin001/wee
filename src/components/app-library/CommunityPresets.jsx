import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import Text from '../../ui/Text';
import Button from '../../ui/WButton';
import WInput from '../../ui/WInput';
import WSelect from '../../ui/WSelect';
import { ImageModal } from '../modals';
import { getSharedPresets, downloadPreset, getStoragePublicObjectUrl } from '../../utils/supabase';
import { createWeeTransition } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import './community-presets.css';

const SEARCH_DEBOUNCE_MS = 300;

const CommunityPresets = ({ onImportPreset }) => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  /** Debounced copy of searchTerm — drives the network query (local filter stays immediate). */
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [downloading, setDownloading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const mf = useMotionFeedback();
  const cardTransition = createWeeTransition('pillOpen', { reducedMotion: !mf.channelReorderSlotMotion });

  const allTags = [...new Set(presets.flatMap((preset) => preset.tags || []))].sort();

  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      !searchTerm ||
      preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = !selectedTag || (preset.tags && preset.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchTerm]);

  const loadPresets = useCallback(
    async ({ forceFresh = false } = {}) => {
      try {
        setLoading(true);
        const result = await getSharedPresets(debouncedSearchTerm, sortBy, { forceFresh });

        if (result.success) {
          setPresets(result.data);
        } else if (result.error === 'Supabase not configured') {
          setMessage({
            type: 'error',
            text: 'Community features are not configured. Please check your environment variables.',
          });
        } else {
          setMessage({ type: 'error', text: `Failed to load presets: ${result.error}` });
        }
      } catch (error) {
        setMessage({ type: 'error', text: `Error loading presets: ${error.message}` });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearchTerm, sortBy]
  );

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleDownload = async (preset) => {
    try {
      setDownloading(preset.id);
      setMessage({ type: '', text: '' });

      const result = await downloadPreset(preset.id);

      if (result.success) {
        const presetData = result.data;

        if (!presetData || !presetData.name || !presetData.settings) {
          throw new Error('Invalid preset data received');
        }

        const importData = {
          name: presetData.name,
          settings: presetData.settings,
          id: presetData.id,
          wallpaper: presetData.wallpaper,
          version: presetData.version || 1,
          rootPresetId: presetData.rootPresetId || presetData.parentPresetId || presetData.id,
          parentPresetId: presetData.parentPresetId || null,
        };

        const importResult = await onImportPreset([importData]);
        if (importResult?.skippedMax) {
          setMessage({
            type: 'error',
            text: importResult.errors?.[0] || 'Preset limit reached. Delete a local look first.',
          });
        } else if (importResult?.errors?.length && !importResult.imported) {
          setMessage({ type: 'error', text: importResult.errors.join(' ') });
        } else if (importResult?.errors?.length) {
          setMessage({
            type: 'success',
            text: `Installed with notes: ${importResult.errors.join(' ')}`,
          });
        } else {
          setMessage({ type: 'success', text: 'Preset downloaded and installed!' });
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 4200);

        await loadPresets({ forceFresh: true });
      } else {
        setMessage({ type: 'error', text: `Failed to download: ${result.error}` });
      }
    } catch (error) {
      console.error('[CommunityPresets] Download error:', error);
      setMessage({ type: 'error', text: `Download failed: ${error.message}` });
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const handleImageClick = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setImageModalOpen(true);
  };

  const tagOptions = [
    { value: '', label: 'All tags' },
    ...allTags.map((tag) => ({ value: tag, label: tag })),
  ];
  const sortOptions = [
    { value: 'created_at', label: 'Newest first' },
    { value: 'downloads', label: 'Most downloaded' },
    { value: 'name', label: 'Name A–Z' },
  ];

  return (
    <div className="community-presets-root">
      {message.text ? (
        <div
          className={`community-msg ${
            message.type === 'success' ? 'community-msg--success' : 'community-msg--error'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="community-toolbar mb-4 rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.55)] p-3">
        <div className="community-search-grow">
          <WInput
            variant="wee"
            type="text"
            placeholder="Search presets…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <WSelect value={selectedTag} onChange={setSelectedTag} options={tagOptions} />
        <WSelect value={sortBy} onChange={setSortBy} options={sortOptions} />
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => loadPresets({ forceFresh: true })}
          title="Refetch community presets now"
        >
          <RefreshCcw size={14} aria-hidden />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="community-center-pad">
          <Text>Loading community presets…</Text>
        </div>
      ) : filteredPresets.length === 0 ? (
        <div className="community-center-pad rounded-2xl border border-dashed border-[hsl(var(--border-primary))] py-10">
          <Text className="!m-0 text-[hsl(var(--text-tertiary))]">No community presets found</Text>
        </div>
      ) : (
        <div className="community-grid">
          {filteredPresets.map((preset, index) => (
            <m.div
              key={preset.id}
              className="community-preset-card rounded-2xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary))] p-3 shadow-[var(--shadow-sm)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...cardTransition, delay: Math.min(index * 0.03, 0.24) }}
              whileHover={{ y: -2, scale: 1.01 }}
            >
              <div className="community-mb-8">
                {preset.display_image_url ? (
                  <div
                    className="community-thumb-wrap"
                    onClick={() =>
                      handleImageClick(
                        getStoragePublicObjectUrl('preset-displays', preset.display_image_url),
                        preset.name
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleImageClick(
                          getStoragePublicObjectUrl('preset-displays', preset.display_image_url),
                          preset.name
                        );
                      }
                    }}
                  >
                    <img
                      src={getStoragePublicObjectUrl('preset-displays', preset.display_image_url)}
                      alt=""
                    />
                  </div>
                ) : (
                  <div className="community-placeholder">
                    <span className="text-xs font-bold uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                      Look
                    </span>
                  </div>
                )}
              </div>

              <div className="community-mb-8">
                <Text variant="p" className="community-preset-title">
                  {preset.name}
                </Text>
                <Text variant="small" className="community-preset-meta">
                  {preset.creator_name ? `by ${preset.creator_name}` : 'Community'} ·{' '}
                  {formatDate(preset.created_at)}
                </Text>
                {preset.description ? (
                  <Text variant="small" className="community-preset-desc">
                    {preset.description}
                  </Text>
                ) : null}
              </div>

              <Button
                variant="primary"
                className="w-full"
                disabled={downloading === preset.id}
                onClick={() => handleDownload(preset)}
              >
                {downloading === preset.id ? 'Installing…' : 'Download'}
              </Button>
            </m.div>
          ))}
        </div>
      )}

      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={selectedImage?.url}
        title={selectedImage?.title}
      />
    </div>
  );
};

CommunityPresets.propTypes = {
  onImportPreset: PropTypes.func.isRequired,
};

export default CommunityPresets;
