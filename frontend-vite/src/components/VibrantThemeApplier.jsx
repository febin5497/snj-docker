import { useEffect } from 'react';

const LIGHT_TO_DARK = {
  'white':              'rgba(255,255,255,0.04)',
  '#ffffff':            'rgba(255,255,255,0.04)',
  '#fff':               'rgba(255,255,255,0.04)',
  'rgb(255, 255, 255)':'rgba(255,255,255,0.04)',
};

const BG_LIGHT_REGEX = /(?:background(?:-color)?\s*:\s*)(#f[0-9a-fA-F]{2,8}|#[0-9a-fA-F]{6}|white|rgb\([^)]+\)|linear-gradient\([^)]+\))/gi;
const COLOR_REGEX    = /(?:color\s*:\s*)(#1e293b|#333|#000|#111|#222|#444|#555|#666|black|rgb\(3[0-9],|rgb\(5[0-9],|rgb\(1[0-5][0-9],)/gi;

function isLightBg(v) {
  if (!v) return false;
  const s = v.toLowerCase().trim();
  if (s === 'white' || s === '#fff' || s === '#ffffff' || s === 'rgb(255, 255, 255)') return true;
  if (/^#f[0-9a-f]{2,6}$/i.test(s)) return true;
  if (/^rgb\(\s*2[3-5][0-9]/.test(s) && /,\s*2[3-5][0-9]/.test(s)) return true;
  if (s.includes('linear-gradient(135deg, #f0f5ff')) return true;
  if (s.includes('linear-gradient(135deg, #e8f0fe')) return true;
  if (s.includes('#f0f5ff') || s.includes('#e8f0fe') || s.includes('#f0f0f0') || s.includes('#f9f9f9')) return true;
  if (s.includes('#f3f4f6') || s.includes('#f9fafb') || s.includes('#faf5ff') || s.includes('#fef2f2') || s.includes('#ecfdf5') || s.includes('#fee2e2')) return true;
  return false;
}

function isLightColor(v) {
  if (!v) return false;
  const s = v.toLowerCase().trim();
  if (s === '#1e293b' || s === '#333' || s === '#000' || s === 'black') return true;
  if (/^#(1|2|3|4|5)[0-9a-f]{2,6}$/i.test(s)) return true;
  if (/^rgb\(\s*[1-5][0-9],/.test(s)) return true;
  return false;
}

function overrideElement(el) {
  const style = el.style;
  if (!style) return;

  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    const val  = style.getPropertyValue(prop);

    if ((prop === 'background' || prop === 'background-color' || prop === 'backgroundColor') && isLightBg(val)) {
      if (val.includes('linear-gradient')) {
        style.setProperty(prop, 'linear-gradient(135deg, #1A1A3E 0%, #0D0D2B 100%)', 'important');
      } else if (val.includes('#0052CC') || val.includes('#f0f5ff')) {
        style.setProperty(prop, 'linear-gradient(135deg, #6C5CE7, #A29BFE)', 'important');
      } else {
        style.setProperty(prop, 'rgba(255,255,255,0.04)', 'important');
      }
    }

    if (prop === 'color' && isLightColor(val)) {
      style.setProperty(prop, '#FFFFFF', 'important');
    }

    if (prop === 'border-color' || prop === 'borderBottomColor' || prop === 'borderTopColor') {
      if (val && (val.includes('#0052CC') || val.includes('#e2e8f0') || val.includes('#ddd'))) {
        style.setProperty(prop, 'rgba(255,255,255,0.08)', 'important');
      }
    }
  }
}

function walk(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    overrideElement(node);
  }
}

export default function VibrantThemeApplier() {
  useEffect(() => {
    const root = document.querySelector('.v-main') || document.body;

    walk(root);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const added of m.addedNodes) {
          if (added.nodeType === 1) {
            overrideElement(added);
            walk(added);
          }
        }
        if (m.type === 'attributes' && m.attributeName === 'style') {
          overrideElement(m.target);
        }
      }
    });

    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

    const interval = setInterval(() => walk(root), 1500);

    return () => { mo.disconnect(); clearInterval(interval); };
  }, []);

  return null;
}
