import React from 'react';
import { colors, typography, spacing, borderRadius, shadows, componentTokens } from '@/styles/design-system';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">True Label Design System</h1>
          <p className="text-lg text-gray-600">A comprehensive design system for consistent UI development</p>
        </header>

        {/* Color Palette Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Color Palette</h2>
          
          {/* Primary Colors */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Primary Colors</h3>
            <div className="grid grid-cols-11 gap-2">
              {Object.entries(colors.primary).map(([shade, color]) => (
                <div key={shade} className="text-center">
                  <div
                    className="w-full h-16 rounded-md shadow-sm mb-2"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-gray-600">{shade}</p>
                  <p className="text-xs text-gray-500">{color}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {['success', 'error', 'warning', 'info'].map((semantic) => (
              <div key={semantic}>
                <h3 className="text-lg font-medium text-gray-700 mb-4 capitalize">{semantic}</h3>
                <div className="space-y-2">
                  {Object.entries(colors[semantic as keyof typeof colors]).slice(2, 8).map(([shade, color]) => (
                    <div key={shade} className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-md shadow-sm"
                        style={{ backgroundColor: color as string }}
                      />
                      <div>
                        <p className="text-sm font-medium">{shade}</p>
                        <p className="text-xs text-gray-500">{color as string}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Typography</h2>
          
          <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
            {Object.entries(typography.fontSize).map(([size, [fontSize, { lineHeight }]]) => (
              <div key={size} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-gray-500 font-mono">text-{size}</span>
                  <span className="text-sm text-gray-500">{fontSize} / {lineHeight}</span>
                </div>
                <p style={{ fontSize, lineHeight }}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Spacing Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Spacing System</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Spacing Scale</h3>
              <div className="space-y-3">
                {Object.entries(spacing).slice(0, 20).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 font-mono w-12">{key}</span>
                    <div className="flex-1 bg-gray-100 rounded">
                      <div
                        className="bg-primary-500 h-8 rounded"
                        style={{ width: value }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-16">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Spacing Examples</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded">
                  <p className="text-sm text-gray-600 mb-2">Padding: p-4 (1rem)</p>
                  <div className="bg-white p-4 rounded shadow-sm">Content</div>
                </div>
                <div className="p-6 bg-gray-100 rounded">
                  <p className="text-sm text-gray-600 mb-2">Padding: p-6 (1.5rem)</p>
                  <div className="bg-white p-6 rounded shadow-sm">Content</div>
                </div>
                <div className="p-8 bg-gray-100 rounded">
                  <p className="text-sm text-gray-600 mb-2">Padding: p-8 (2rem)</p>
                  <div className="bg-white p-8 rounded shadow-sm">Content</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Border Radius Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Border Radius</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(borderRadius).map(([key, value]) => (
              <div key={key} className="text-center">
                <div
                  className="w-full h-24 bg-primary-500 shadow-sm mb-2"
                  style={{ borderRadius: value }}
                />
                <p className="text-sm font-medium">rounded-{key === 'DEFAULT' ? '' : key}</p>
                <p className="text-xs text-gray-500">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shadows Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Shadows</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(shadows).slice(0, 7).map(([key, value]) => (
              <div key={key} className="bg-white p-6 rounded-lg" style={{ boxShadow: value as string }}>
                <p className="text-sm font-medium mb-1">shadow-{key === 'DEFAULT' ? '' : key}</p>
                <p className="text-xs text-gray-500">{value as string}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Component Examples Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Component Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buttons */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Buttons</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button className="btn-primary">Primary</button>
                  <button className="btn-secondary">Secondary</button>
                  <button className="btn-outline">Outline</button>
                  <button className="btn-ghost">Ghost</button>
                </div>
                <div className="flex gap-4">
                  <button className="btn-primary btn-sm">Small</button>
                  <button className="btn-primary">Medium</button>
                  <button className="btn-primary btn-lg">Large</button>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Badges</h3>
              <div className="flex flex-wrap gap-3">
                <span className="badge badge-success">Success</span>
                <span className="badge badge-error">Error</span>
                <span className="badge badge-warning">Warning</span>
                <span className="badge badge-info">Info</span>
                <span className="badge border-gray-300">Default</span>
              </div>
            </div>

            {/* Cards */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Cards</h3>
              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-semibold">Card Title</h4>
                  <p className="text-sm text-gray-500">Card description goes here</p>
                </div>
                <div className="card-content">
                  <p>This is the card content area where you can place any content.</p>
                </div>
                <div className="card-footer">
                  <button className="btn-primary btn-sm">Action</button>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Form Inputs</h3>
              <div className="space-y-4">
                <input type="text" className="input" placeholder="Default input" />
                <input type="text" className="input" placeholder="Disabled input" disabled />
                <select className="input">
                  <option>Select option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
                <textarea className="input" rows={3} placeholder="Textarea" />
              </div>
            </div>
          </div>
        </section>

        {/* Animation Examples */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Animations</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-lg mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Pulse</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-lg mx-auto mb-2 animate-spin" />
              <p className="text-sm">Spin</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-lg mx-auto mb-2 animate-bounce" />
              <p className="text-sm">Bounce</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-lg mx-auto mb-2 animate-ping" />
              <p className="text-sm">Ping</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}