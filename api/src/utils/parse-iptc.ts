const IPTC_ENTRY_TYPES = new Map([
	[0x78, 'caption'],
	[0x6e, 'credit'],
	[0x19, 'keywords'],
	[0x37, 'dateCreated'],
	[0x50, 'byline'],
	[0x55, 'bylineTitle'],
	[0x7a, 'captionWriter'],
	[0x69, 'headline'],
	[0x74, 'copyright'],
	[0x0f, 'category'],
]);

const IPTC_ENTRY_MARKER = Buffer.from([0x1c, 0x02]);

export default function parseIPTC(buffer: Buffer): Record<string, any> {
	if (!Buffer.isBuffer(buffer)) return {};

	const iptc: Record<string, any> = {};
	let lastIptcEntryPos = buffer.indexOf(IPTC_ENTRY_MARKER);

	while (lastIptcEntryPos !== -1) {
		lastIptcEntryPos = buffer.indexOf(IPTC_ENTRY_MARKER, lastIptcEntryPos + IPTC_ENTRY_MARKER.byteLength);

		const iptcBlockTypePos = lastIptcEntryPos + IPTC_ENTRY_MARKER.byteLength;
		const iptcBlockSizePos = iptcBlockTypePos + 1;
		const iptcBlockDataPos = iptcBlockSizePos + 2;

		const iptcBlockType = buffer.readUInt8(iptcBlockTypePos);
		const iptcBlockSize = buffer.readUInt16BE(iptcBlockSizePos);

		if (!IPTC_ENTRY_TYPES.has(iptcBlockType)) {
			continue;
		}

		const iptcBlockTypeId = IPTC_ENTRY_TYPES.get(iptcBlockType);
		const iptcData = buffer.slice(iptcBlockDataPos, iptcBlockDataPos + iptcBlockSize).toString();

		if (iptcBlockTypeId) {
			if (iptc[iptcBlockTypeId] == null) {
				iptc[iptcBlockTypeId] = iptcData;
			} else if (Array.isArray(iptc[iptcBlockTypeId])) {
				iptc[iptcBlockTypeId].push(iptcData);
			} else {
				iptc[iptcBlockTypeId] = [iptc[iptcBlockTypeId], iptcData];
			}
		}
	}

	return iptc;
}
