import { BUILT_IN_COLLECTION_GROUPS } from '../data/collections';
import type { Collection } from '../types';

export function CollectionOptions({ collections, allValue = '', allLabel, customLabel }: { collections: Collection[]; allValue?: string; allLabel?: string; customLabel: string }) {
  const available = new Set(collections.map((item) => item.id));
  const custom = collections.filter((item) => item.isCustom);
  return <>
    {allLabel !== undefined && <option value={allValue}>{allLabel}</option>}
    {BUILT_IN_COLLECTION_GROUPS.map((group) => {
      const items = group.collections.filter((item) => available.has(item.id));
      return items.length ? <optgroup label={group.label} key={group.label}>{items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.countryCodes.length})</option>)}</optgroup> : null;
    })}
    {custom.length > 0 && <optgroup label={customLabel}>{custom.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.countryCodes.length})</option>)}</optgroup>}
  </>;
}
