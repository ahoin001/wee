import React from 'react';
import PropTypes from 'prop-types';
import Card from '../../../ui/Card';
import Slider from '../../../ui/Slider';
import Text from '../../../ui/Text';
import WButton from '../../../ui/WButton';
import WToggle from '../../../ui/WToggle';

function ChannelModalBehaviorTab({
  channelId,
  asAdmin,
  setAsAdmin,
  hoverSoundEnabled,
  setHoverSoundEnabled,
  hoverSoundUrl,
  hoverSoundName,
  hoverSoundVolume,
  hoverSoundAudio,
  selectedHoverSoundId,
  uploadingHoverSound,
  hoverSoundInputRef,
  soundLibraryLoading,
  getSoundsByCategory,
  clearHoverSoundSelection,
  handleTestHoverSound,
  handleHoverSoundVolumeChange,
  handleHoverSoundSelect,
  handleHoverSoundUpload,
  handleHoverSoundFile,
  animatedOnHover,
  setAnimatedOnHover,
  kenBurnsEnabled,
  setKenBurnsEnabled,
  kenBurnsMode,
  setKenBurnsMode,
}) {
  const channelHoverSounds = getSoundsByCategory('channelHover') || [];

  const renderDisplayOptionsSection = () => (
    <div className="channel-row-radio">
      <label className="channel-radio-label channel-radio-label-compact">
        <input
          type="radio"
          name={`admin-mode-${channelId}`}
          checked={!asAdmin}
          onChange={() => setAsAdmin(false)}
        />
        Normal Launch
      </label>
      <label className="channel-radio-label channel-radio-label-compact">
        <input
          type="radio"
          name={`admin-mode-${channelId}`}
          checked={asAdmin}
          onChange={() => setAsAdmin(true)}
        />
        Run as Administrator
      </label>
    </div>
  );

  const renderHoverSoundSection = () => (
    <div className="channel-stack-16">
      {hoverSoundEnabled && hoverSoundUrl && (
        <div className="channel-surface-block">
          <div className="channel-header-row">
            <Text variant="p" className="!font-semibold !m-0">
              Selected Sound: {hoverSoundName}
            </Text>
            <WButton variant="tertiary" size="sm" onClick={clearHoverSoundSelection}>
              Clear
            </WButton>
          </div>

          <div className="channel-row-gap-12">
            <WButton variant="secondary" size="sm" onClick={handleTestHoverSound} disabled={!hoverSoundUrl}>
              {hoverSoundAudio ? 'Stop' : 'Test'}
            </WButton>

            <div className="channel-row-gap-8 channel-fill">
              <span className="channel-volume-label">Volume:</span>
              <Slider
                value={hoverSoundVolume}
                onChange={(value) => handleHoverSoundVolumeChange(value)}
                min={0}
                max={1}
                step={0.01}
                className="channel-fill"
              />
              <span className="channel-volume-value">{Math.round(hoverSoundVolume * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="channel-row-gap-12 channel-row-between channel-mb-12">
          <Text variant="p" className="!font-semibold !m-0">
            Choose from Sound Library
          </Text>
          <WButton variant="primary" size="sm" onClick={handleHoverSoundUpload} disabled={uploadingHoverSound}>
            {uploadingHoverSound ? 'Uploading...' : 'Upload New Sound'}
          </WButton>
        </div>

        {soundLibraryLoading ? (
          <div className="channel-surface-block channel-surface-centered channel-surface-p20 channel-text-tertiary">
            Loading sound library...
          </div>
        ) : channelHoverSounds.length === 0 ? (
          <div className="channel-surface-block channel-surface-centered channel-surface-p20 channel-text-tertiary">
            No hover sounds available. Upload your first sound above.
          </div>
        ) : (
          <div className="channel-sound-grid">
            {channelHoverSounds.map((sound) => (
              <div
                key={sound.id}
                onClick={() => handleHoverSoundSelect(sound.id)}
                className={`channel-sound-card ${selectedHoverSoundId === sound.id ? 'channel-sound-card-selected' : ''}`}
              >
                <div className="channel-header-row">
                  <Text variant="p" className="!font-medium !m-0 !text-[14px]">
                    {sound.name}
                  </Text>
                  {selectedHoverSoundId === sound.id && <span className="channel-checkmark">✓</span>}
                </div>

                <div className="channel-row-gap-8">
                  <WButton
                    variant="tertiary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const testAudio = new Audio(sound.url);
                      testAudio.volume = sound.volume ?? 0.5;
                      testAudio.play();
                      testAudio.onended = () => {
                        testAudio.src = '';
                        testAudio.load();
                      };
                    }}
                    className="channel-min-w-60"
                  >
                    Test
                  </WButton>

                  <div className="channel-row-gap-4 channel-fill">
                    <span className="channel-tiny-label">Vol:</span>
                    <span className="channel-tiny-label">{Math.round((sound.volume ?? 0.5) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="channel-surface-block channel-surface-subtle">
        <Text variant="p" className="!font-semibold !m-0 !mb-2 !text-[14px]">
          Legacy File Upload
        </Text>
        <div className="channel-row-gap-10">
          <button
            type="button"
            className="file-button"
            id="channel-legacy-upload-button"
            onClick={async () => {
              if (window.api && window.api.sounds && window.api.sounds.selectFile) {
                const result = await window.api.sounds.selectFile();
                if (result && result.success && result.file) {
                  await handleHoverSoundFile(result.file);
                } else if (result && result.error) {
                  alert(`Failed to select sound file: ${result.error}`);
                }
              } else {
                hoverSoundInputRef.current?.click();
              }
            }}
          >
            {hoverSoundName || 'Select Audio File'}
          </button>
          <input
            type="file"
            accept="audio/*"
            ref={hoverSoundInputRef}
            onChange={(e) => handleHoverSoundFile(e.target.files[0])}
            className="hidden"
          />
          <span className="channel-legacy-upload-note">Direct file upload (not saved to library)</span>
        </div>
      </div>

      <Text variant="help" className="channel-help-sm">
        Sound will fade in on hover, and fade out on leave or click. Sounds uploaded to the library are saved permanently
        and can be reused across channels.
      </Text>
    </div>
  );

  const renderAnimationToggleSection = () => (
    <div className="channel-stack-8">
      <label className="channel-radio-label">
        <input
          type="radio"
          name="animatedOnHover"
          value="global"
          checked={animatedOnHover === undefined || animatedOnHover === 'global'}
          onChange={() => setAnimatedOnHover('global')}
        />
        Use global setting
      </label>
      <label className="channel-radio-label">
        <input
          type="radio"
          name="animatedOnHover"
          value="true"
          checked={animatedOnHover === true}
          onChange={() => setAnimatedOnHover(true)}
        />
        Only play animation on hover (override)
      </label>
      <label className="channel-radio-label">
        <input
          type="radio"
          name="animatedOnHover"
          value="false"
          checked={animatedOnHover === false}
          onChange={() => setAnimatedOnHover(false)}
        />
        Always play animation (override)
      </label>
    </div>
  );

  const renderKenBurnsSection = () => (
    <div className="channel-stack-16">
      <div>
        <Text as="label" size="md" weight={600} className="block mb-2">
          Ken Burns Effect
        </Text>
        <div className="channel-stack-8">
          <label className="channel-radio-label">
            <input
              type="radio"
              name="kenBurnsEnabled"
              value="global"
              checked={kenBurnsEnabled === undefined || kenBurnsEnabled === 'global'}
              onChange={() => setKenBurnsEnabled('global')}
            />
            Use global setting
          </label>
          <label className="channel-radio-label">
            <input
              type="radio"
              name="kenBurnsEnabled"
              value="true"
              checked={kenBurnsEnabled === true}
              onChange={() => setKenBurnsEnabled(true)}
            />
            Enable for this channel (override)
          </label>
          <label className="channel-radio-label">
            <input
              type="radio"
              name="kenBurnsEnabled"
              value="false"
              checked={kenBurnsEnabled === false}
              onChange={() => setKenBurnsEnabled(false)}
            />
            Disable for this channel (override)
          </label>
        </div>
      </div>

      {kenBurnsEnabled === true && (
        <div>
          <Text as="label" size="md" weight={600} className="block mb-2">
            Activation Mode
          </Text>
          <div className="channel-stack-8">
            <label className="channel-radio-label">
              <input
                type="radio"
                name="kenBurnsMode"
                value="global"
                checked={kenBurnsMode === undefined || kenBurnsMode === 'global'}
                onChange={() => setKenBurnsMode('global')}
              />
              Use global setting
            </label>
            <label className="channel-radio-label">
              <input
                type="radio"
                name="kenBurnsMode"
                value="hover"
                checked={kenBurnsMode === 'hover'}
                onChange={() => setKenBurnsMode('hover')}
              />
              Hover to activate (override)
            </label>
            <label className="channel-radio-label">
              <input
                type="radio"
                name="kenBurnsMode"
                value="autoplay"
                checked={kenBurnsMode === 'autoplay'}
                onChange={() => setKenBurnsMode('autoplay')}
              />
              Always active (override)
            </label>
            <label className="channel-radio-label channel-radio-disabled">
              <input
                type="radio"
                name="kenBurnsMode"
                value="slideshow"
                checked={kenBurnsMode === 'slideshow'}
                onChange={() => setKenBurnsMode('slideshow')}
                disabled
              />
              Slideshow mode (override){' '}
              <span className="text-[hsl(var(--state-error))] text-[11px]">- Not Ready</span>
            </label>
          </div>
        </div>
      )}

      <Text variant="help">
        {kenBurnsEnabled === true
          ? 'Ken Burns adds cinematic zoom and pan effects to images. Perfect for creating dynamic single-image channels.'
          : kenBurnsEnabled === false
            ? 'Ken Burns effect is disabled for this channel, even if enabled globally.'
            : 'This channel will follow the global Ken Burns setting.'}
      </Text>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card title="Launch Options" separator desc="Choose how this application should be launched when the channel is clicked.">
        {renderDisplayOptionsSection()}
      </Card>

      <Card
        title="Custom Hover Sound"
        separator
        desc="Set a custom sound to play when hovering over this channel."
        headerActions={<WToggle checked={hoverSoundEnabled} onChange={(checked) => setHoverSoundEnabled(checked)} />}
      >
        {hoverSoundEnabled && <div>{renderHoverSoundSection()}</div>}
        {!hoverSoundEnabled && (
          <span className="channel-inline-help">Set a custom sound to play when hovering over this channel.</span>
        )}
      </Card>

      <Card
        title="Animation on Hover"
        separator
        desc="Override the global setting for this channel. Only play GIFs/MP4s when hovered if enabled."
      >
        {renderAnimationToggleSection()}
      </Card>

      <Card
        title="Ken Burns Effect"
        separator
        desc="Override the global Ken Burns setting for this channel. Adds cinematic zoom and pan to images."
      >
        {renderKenBurnsSection()}
      </Card>
    </div>
  );
}

ChannelModalBehaviorTab.propTypes = {
  channelId: PropTypes.string.isRequired,
  asAdmin: PropTypes.bool,
  setAsAdmin: PropTypes.func.isRequired,
  hoverSoundEnabled: PropTypes.bool,
  setHoverSoundEnabled: PropTypes.func.isRequired,
  hoverSoundUrl: PropTypes.string,
  hoverSoundName: PropTypes.string,
  hoverSoundVolume: PropTypes.number,
  hoverSoundAudio: PropTypes.object,
  selectedHoverSoundId: PropTypes.string,
  uploadingHoverSound: PropTypes.bool,
  hoverSoundInputRef: PropTypes.object,
  soundLibraryLoading: PropTypes.bool,
  getSoundsByCategory: PropTypes.func.isRequired,
  clearHoverSoundSelection: PropTypes.func.isRequired,
  handleTestHoverSound: PropTypes.func.isRequired,
  handleHoverSoundVolumeChange: PropTypes.func.isRequired,
  handleHoverSoundSelect: PropTypes.func.isRequired,
  handleHoverSoundUpload: PropTypes.func.isRequired,
  handleHoverSoundFile: PropTypes.func.isRequired,
  animatedOnHover: PropTypes.oneOf([true, false, 'global', undefined]),
  setAnimatedOnHover: PropTypes.func.isRequired,
  kenBurnsEnabled: PropTypes.oneOf([true, false, 'global', undefined]),
  setKenBurnsEnabled: PropTypes.func.isRequired,
  kenBurnsMode: PropTypes.oneOf(['hover', 'autoplay', 'slideshow', 'global', undefined]),
  setKenBurnsMode: PropTypes.func.isRequired,
};

export default React.memo(ChannelModalBehaviorTab);
