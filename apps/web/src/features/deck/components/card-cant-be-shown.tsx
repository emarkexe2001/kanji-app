/**
 * What is drawn in place of a card that can't be shown (FEAT2_6): a card whose data is missing
 * (CHORE8), or one whose details throw while being drawn (see CardErrorBoundary).
 */
export function CardCantBeShown() {
  return (
    <p className="rounded-lg border border-dashed border-field-line bg-card p-2 text-xs text-muted-strong">
      This card can&apos;t be shown.
    </p>
  );
}
