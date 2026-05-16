import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResumeNextPanel } from './ResumeNextPanel';

describe('ResumeNextPanel', () => {
  it('renders the recommended next step and emits the selected recommendation', () => {
    const recommendation = {
      type: 'next',
      eyebrow: 'Next lesson',
      title: 'Forms',
      detail: 'HTML > Basics',
      cta: 'Start lesson',
    };
    const onAction = vi.fn();

    render(
      <ResumeNextPanel
        recommendation={recommendation}
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('region', { name: 'Recommended next step' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Forms' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start lesson' }));

    expect(onAction).toHaveBeenCalledWith(recommendation);
  });

  it('renders nothing without a recommendation', () => {
    const { container } = render(<ResumeNextPanel recommendation={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
