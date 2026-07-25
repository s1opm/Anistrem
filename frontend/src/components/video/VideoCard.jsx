import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiPlay } from 'react-icons/hi';

const styles = {
  card: (isHovered) => ({
    position: 'relative',
    borderRadius: '12px',
    padding: '1px',
    backgroundImage: isHovered
      ? 'linear-gradient(135deg, #03c1ef, #8c3596)'
      : 'linear-gradient(135deg, #00475b, #670077)',
    transition: 'all 0.3s ease',
    transform: isHovered ? 'translateY(-4px)' : 'none',
  }),
  cardInner: {
    background: '#110920',
    borderRadius: '11px',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  thumbnail: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    overflow: 'hidden',
    borderRadius: '11px 11px 0 0',
    background: '#0a0515',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    padding: '2px',
    backgroundImage: 'linear-gradient(135deg, #03c1ef, #8c3596)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'scale(0.75)',
    transition: 'transform 0.3s ease',
    opacity: 0,
  },
  playButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'rgba(17, 9, 32, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    display: 'flex',
    gap: '6px',
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    backdropFilter: 'blur(4px)',
  },
  seasonBadge: {
    background: 'linear-gradient(135deg, #03c1ef, #028ab3)',
    color: '#fff',
  },
  episodeBadge: {
    background: 'linear-gradient(135deg, #8c3596, #670077)',
    color: '#fff',
  },
  info: {
    padding: '12px 14px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  title: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  category: {
    color: '#b5b0d0',
    fontSize: '12px',
  },
  horizontalCard: (isHovered) => ({
    position: 'relative',
    borderRadius: '12px',
    padding: '1px',
    backgroundImage: isHovered
      ? 'linear-gradient(135deg, #03c1ef, #8c3596)'
      : 'linear-gradient(135deg, #00475b, #670077)',
    transition: 'all 0.3s ease',
  }),
  horizontalInner: {
    background: '#110920',
    borderRadius: '11px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
  },
  horizontalThumbnail: {
    position: 'relative',
    width: '180px',
    minHeight: '100px',
    flexShrink: 0,
    overflow: 'hidden',
  },
  horizontalInfo: {
    padding: '12px 14px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '6px',
    minWidth: 0,
  },
};

export default function VideoCard({ video, index = 0, layout = 'vertical' }) {
  if (!video) return null;

  const [isHovered, setIsHovered] = useState(false);

  const title = video.title || 'Untitled';
  const slug = video.slug || video.id;
  const thumbnailUrl = video.thumbnail?.url || video.thumbnail || null;
  const categoryName = video.category?.name;
  const season = video.season;
  const episode = video.episode;

  if (layout === 'horizontal') {
    return (
      <Link to={`/watch/${slug}`} style={{ textDecoration: 'none' }}>
        <div
          style={styles.horizontalCard(isHovered)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={styles.horizontalInner}>
            <div style={styles.horizontalThumbnail}>
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={title}
                  style={{
                    ...styles.thumbnailImg,
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  }}
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #1a0a2e, #110920)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HiPlay size={32} color="#b5b0d0" />
                </div>
              )}
              {season != null && (
                <div style={styles.badgeContainer}>
                  <span style={{ ...styles.badge, ...styles.seasonBadge }}>
                    Season {season}
                  </span>
                  {episode != null && (
                    <span style={{ ...styles.badge, ...styles.episodeBadge }}>
                      EP {episode}
                    </span>
                  )}
                </div>
              )}
              <div
                style={{
                  ...styles.overlay,
                  opacity: isHovered ? 1 : 0,
                }}
              >
                <div
                  style={{
                    ...styles.playButton,
                    transform: isHovered ? 'scale(1)' : 'scale(0.75)',
                    opacity: isHovered ? 1 : 0,
                  }}
                >
                  <div style={styles.playButtonInner}>
                    <HiPlay size={24} color="#fff" style={{ marginLeft: '2px' }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.horizontalInfo}>
              <h3 style={styles.title}>{title}</h3>
              {categoryName && <span style={styles.category}>{categoryName}</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/watch/${slug}`} style={{ textDecoration: 'none' }}>
      <div
        style={styles.card(isHovered)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={styles.cardInner}>
          <div style={styles.thumbnail}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={title}
                style={{
                  ...styles.thumbnailImg,
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a0a2e, #110920)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HiPlay size={40} color="#b5b0d0" />
              </div>
            )}
            {season != null && (
              <div style={styles.badgeContainer}>
                <span style={{ ...styles.badge, ...styles.seasonBadge }}>
                  Season {season}
                </span>
                {episode != null && (
                  <span style={{ ...styles.badge, ...styles.episodeBadge }}>
                    EP {episode}
                  </span>
                )}
              </div>
            )}
            <div
              style={{
                ...styles.overlay,
                opacity: isHovered ? 1 : 0,
              }}
            >
              <div
                style={{
                  ...styles.playButton,
                  transform: isHovered ? 'scale(1)' : 'scale(0.75)',
                  opacity: isHovered ? 1 : 0,
                }}
              >
                <div style={styles.playButtonInner}>
                  <HiPlay size={24} color="#fff" style={{ marginLeft: '2px' }} />
                </div>
              </div>
            </div>
          </div>
          <div style={styles.info}>
            <h3 style={styles.title}>{title}</h3>
            {categoryName && <span style={styles.category}>{categoryName}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
