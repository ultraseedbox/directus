<template>
	<div class="editor">
		<div v-if="editor" class="editor__header">
			<v-menu show-arrow placement="bottom-start">
				<template #activator="{ toggle, active }">
					<v-button small icon @click="toggle" v-tooltip="$t('wysiwyg_options.heading')">
						<v-icon name="format_size" :class="{ active: editor.isActive('heading') || active }" />
					</v-button>
				</template>
				<v-list>
					<v-list-item
						v-for="n in 6"
						:key="n"
						:active="editor.isActive('heading', { level: n })"
						@click="editor.chain().focus().toggleHeading({ level: n }).run()"
					>
						<v-list-item-content><v-text-overflow :text="$t(`wysiwyg_options.h${n}`)" /></v-list-item-content>
						<v-list-item-hint>{{ translateShortcut(['meta', 'alt']) }} {{ n }}</v-list-item-hint>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-button
				small
				icon
				@click="editor.chain().focus().toggleBold().run()"
				v-tooltip="$t('wysiwyg_options.bold') + ' - ' + translateShortcut(['meta', 'b'])"
			>
				<v-icon name="format_bold" :class="{ active: editor.isActive('bold') }" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().toggleItalic().run()"
				v-tooltip="$t('wysiwyg_options.italic') + ' - ' + translateShortcut(['meta', 'i'])"
			>
				<v-icon name="format_italic" :class="{ active: editor.isActive('italic') }" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().toggleUnderline().run()"
				v-tooltip="$t('wysiwyg_options.underline') + ' - ' + translateShortcut(['meta', 'u'])"
			>
				<v-icon name="format_underline" :class="{ active: editor.isActive('underline') }" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().toggleStrike().run()"
				v-tooltip="$t('wysiwyg_options.strikethrough') + ' - ' + translateShortcut(['meta', 'shift', 'x'])"
			>
				<v-icon name="format_strikethrough" :class="{ active: editor.isActive('strike') }" />
			</v-button>

			<v-button small icon @click="setLink()" v-tooltip="$t('wysiwyg_options.link')">
				<v-icon name="insert_link" :class="{ active: editor.isActive('link') }" />
			</v-button>

			<v-button
				small
				icon
				@click="editor.chain().focus().setTextAlign('left').run()"
				v-tooltip="$t('wysiwyg_options.alignleft') + ' - ' + translateShortcut(['meta', 'shift', 'l'])"
			>
				<v-icon name="format_align_left" :class="{ active: editor.isActive({ textAlign: 'left' }) }" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().setTextAlign('center').run()"
				v-tooltip="$t('wysiwyg_options.aligncenter') + ' - ' + translateShortcut(['meta', 'shift', 'e'])"
			>
				<v-icon name="format_align_center" :class="{ active: editor.isActive({ textAlign: 'center' }) }" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().setTextAlign('right').run()"
				v-tooltip="$t('wysiwyg_options.alignright') + ' - ' + translateShortcut(['meta', 'shift', 'r'])"
			>
				<v-icon name="format_align_right" :class="{ active: editor.isActive({ textAlign: 'right' }) }" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().setTextAlign('justify').run()"
				v-tooltip="$t('wysiwyg_options.alignjustify') + ' - ' + translateShortcut(['meta', 'shift', 'j'])"
			>
				<v-icon name="format_align_justify" :class="{ active: editor.isActive({ textAlign: 'justify' }) }" />
			</v-button>

			<v-button
				small
				icon
				@click="editor.chain().focus().toggleBulletList().run()"
				v-tooltip="$t('wysiwyg_options.bullist') + ' - ' + translateShortcut(['meta', 'shift']) + '8'"
			>
				<v-icon name="format_list_bulleted" :class="{ active: editor.isActive('bulletList') }" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().toggleOrderedList().run()"
				v-tooltip="$t('wysiwyg_options.numlist') + ' - ' + translateShortcut(['meta', 'shift']) + '7'"
			>
				<v-icon name="format_list_numbered" :class="{ active: editor.isActive('orderedList') }" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().toggleBlockquote().run()"
				v-tooltip="$t('wysiwyg_options.blockquote') + ' - ' + translateShortcut(['meta', 'shift', 'b'])"
			>
				<v-icon name="format_quote" :class="{ active: editor.isActive('blockquote') }" />
			</v-button>

			<v-button
				small
				icon
				@click="editor.chain().focus().setHorizontalRule().run()"
				v-tooltip="$t('wysiwyg_options.hr')"
			>
				<v-icon name="horizontal_rule" :class="{ active: editor.isActive('horizontalRule') }" />
			</v-button>

			<v-button small icon @click="setImage()" v-tooltip="$t('wysiwyg_options.image')">
				<v-icon name="insert_photo" :class="{ active: editor.isActive('image') }" />
			</v-button>

			<v-button
				small
				icon
				@click="editor.chain().focus().undo().run()"
				v-tooltip="$t('wysiwyg_options.undo') + ' - ' + translateShortcut(['meta', 'z'])"
			>
				<v-icon name="undo" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().redo().run()"
				v-tooltip="$t('wysiwyg_options.redo') + ' - ' + translateShortcut(['meta', 'shift', 'z'])"
			>
				<v-icon name="redo" />
			</v-button>
			<v-button
				small
				icon
				@click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
				v-tooltip="$t('wysiwyg_options.removeformat')"
			>
				<v-icon name="format_clear" />
			</v-button>
		</div>

		<EditorContent class="editor__content" :editor="editor" />

		<v-dialog v-model="linkDialogOpen">
			<v-card>
				<v-card-title class="card-title">{{ $t('wysiwyg_options.link') }}</v-card-title>
				<v-card-text>
					<div class="grid">
						<div class="field">
							<div class="type-label">{{ $t('url') }}</div>
							<v-input v-model="linkSelection.url" :placeholder="$t('url_placeholder')"></v-input>
						</div>
						<div class="field">
							<div class="type-label">{{ $t('open_link_in') }}</div>
							<v-checkbox
								block
								v-model="linkSelection.newTab"
								:label="$t(linkSelection.newTab ? 'new_tab' : 'current_tab')"
							></v-checkbox>
						</div>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button @click="closeLinkDialog" secondary>{{ $t('cancel') }}</v-button>
					<v-button :disabled="linkSelection.url === null" @click="saveLink">{{ $t('save') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :active="imageDialogOpen" @esc="imageDialogOpen = null" @toggle="imageDialogOpen = null">
			<v-card>
				<v-card-title>{{ $t('upload_from_device') }}</v-card-title>
				<v-card-text>
					<template v-if="imageSelection.imageUrl">
						<img class="image-preview" :src="imageSelection.imageUrl" />
						<div class="grid">
							<div class="field">
								<div class="type-label">{{ $t('image_url') }}</div>
								<v-input v-model="imageSelection.imageUrl" />
							</div>
							<div class="field">
								<div class="type-label">{{ $t('fields.directus_files.title') }}</div>
								<v-input v-model="imageSelection.title" />
							</div>
							<div class="field">
								<div class="type-label">{{ $t('fields.directus_files.description') }}</div>
								<v-input v-model="imageSelection.description" />
							</div>
						</div>
					</template>
					<v-upload v-else @input="onImageSelect" :multiple="false" from-library from-url />
				</v-card-text>
				<v-card-actions>
					<v-button @click="closeImageDialog" secondary>{{ $t('cancel') }}</v-button>
					<v-button :disabled="imageSelection.imageUrl === null" @click="saveImage">
						{{ $t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, watch, ref, toRefs } from '@vue/composition-api';
import { Editor, EditorContent, Content } from '@tiptap/vue-2';

import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Text from '@tiptap/extension-text';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';

import translateShortcut from '@/utils/translate-shortcut';
import { getPublicURL } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';

type ImageSelection = {
	imageUrl: string;
	title: string;
	description: string;
};

type LinkSelection = {
	url: string;
	newTab: boolean;
};

export default defineComponent({
	components: { EditorContent },
	props: {
		value: {
			type: Object,
			default: null,
		},
		placeholder: {
			type: String,
			default: 'Write something...',
		},
		imageToken: {
			type: String,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const { imageToken } = toRefs(props);

		const imageDialogOpen = ref(false);
		const imageSelection = ref<ImageSelection>({
			imageUrl: '',
			title: '',
			description: '',
		});

		function defaultImageSelection() {
			imageSelection.value = {
				imageUrl: '',
				title: '',
				description: '',
			};
		}

		function closeImageDialog() {
			defaultImageSelection();
			imageDialogOpen.value = false;
		}

		function onImageSelect(image: Record<string, any>) {
			let imageUrl = getPublicURL() + 'assets/' + image.id;

			if (imageToken.value) {
				imageUrl = addTokenToURL(imageUrl, imageToken.value);
			}

			imageSelection.value = {
				imageUrl,
				title: image.title,
				description: image.description,
			};
		}

		function saveImage() {
			const img = imageSelection.value;
			if (img === null) return;
			editor.value?.chain().focus().setImage({ src: img.imageUrl, alt: img.title, title: img.description }).run();
			closeImageDialog();
		}

		function setImage() {
			imageDialogOpen.value = true;

			if (editor.value?.isActive('image')) {
				const attrs = editor.value?.getNodeAttributes('image');
				console.log({ attrs });
				const imageUrl = attrs.src;
				const title = attrs.alt;
				const description = attrs.title;

				if (imageUrl === null || title === null) {
					return;
				}

				imageSelection.value = {
					imageUrl,
					title,
					description,
				};
			} else {
				defaultImageSelection();
			}
		}

		const linkDialogOpen = ref(false);
		const linkSelection = ref<LinkSelection>({
			url: '',
			newTab: true,
		});

		function defaultLinkSelection() {
			linkSelection.value = {
				url: '',
				newTab: true,
			};
		}

		function closeLinkDialog() {
			defaultLinkSelection();
			linkDialogOpen.value = false;
		}

		function saveLink() {
			const link = linkSelection.value;
			if (link.url === null) return;
			editor.value
				?.chain()
				.focus()
				.setLink({ href: link.url, target: link.newTab ? '_blank' : '_self' })
				.run();
			closeLinkDialog();
		}

		function setLink() {
			linkDialogOpen.value = true;

			if (editor.value?.isActive('link')) {
				const attrs = editor.value?.getMarkAttributes('link');
				const url = attrs.href;
				const target = attrs.target;

				if (url === null) {
					return;
				}

				linkSelection.value = {
					url,
					newTab: target === '_blank',
				};
			} else {
				defaultLinkSelection();
			}
		}

		const editor = ref<Editor>();

		onMounted(() => {
			editor.value = new Editor({
				extensions: [
					Blockquote,
					Bold,
					BulletList,
					Document,
					Dropcursor,
					Gapcursor,
					HardBreak,
					Heading,
					Highlight,
					History,
					HorizontalRule,
					Image,
					Italic,
					Link.configure({
						openOnClick: false,
					}),
					ListItem,
					OrderedList,
					Paragraph,
					Placeholder.configure({
						placeholder: props.placeholder,
					}),
					Strike,
					TextAlign,
					TextStyle,
					Text,
					Typography,
					Underline,
				],
				content: props.value,
				onUpdate: () => {
					emit('input', editor.value?.getJSON());
				},
			});
		});

		onBeforeUnmount(() => {
			editor.value?.destroy();
		});

		watch(
			() => props.value,
			(newValue: Content) => {
				editor.value?.commands.setContent(newValue, false);
			}
		);

		return {
			editor,
			imageDialogOpen,
			imageSelection,
			closeImageDialog,
			onImageSelect,
			saveImage,
			setImage,
			linkDialogOpen,
			closeLinkDialog,
			saveLink,
			setLink,
			linkSelection,
			translateShortcut,
		};
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.grid {
	@include form-grid;
}

.image-preview,
.media-preview {
	width: 100%;
	height: var(--input-height-tall);
	margin-bottom: 24px;
	object-fit: cover;
	border-radius: var(--border-radius);
}

::v-deep .v-card-title {
	margin-bottom: 24px;
	font-size: 24px;
}

.editor {
	--v-button-background-color: transparent;
	--v-button-color: var(--foreground-normal);
	--v-button-background-color-hover: var(--border-normal);
	--v-button-color-hover: var(--foreground-normal);

	min-height: 300px;
	color: var(--foreground-normal);
	border: 2px solid var(--border-normal);
	border-radius: var(--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: color, border-color;

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&:focus,
	&:focus-within {
		border-color: var(--primary);
	}

	.editor__header {
		position: sticky;
		top: 64px;
		z-index: 3;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		background-color: var(--background-subdued);
		border-bottom: 2px solid var(--border-normal);

		.v-button {
			margin: 2px;
		}

		.v-icon:hover {
			color: var(--foreground-normal);
		}

		.v-icon.active {
			color: var(--primary);
		}
	}

	.editor__content {
		margin: var(--input-padding);
		color: var(--foreground-normal);
		background-color: transparent;
		border: 0;
		resize: none;

		&::placeholder {
			color: var(--foreground-subdued);
		}

		::v-deep {
			/* Basic editor styles */
			.ProseMirror {
				> * + * {
					margin-top: 0.75em;
				}

				p.is-editor-empty:first-child::before {
					float: left;
					height: 0;
					color: var(--foreground-subdued);
					content: attr(data-placeholder);
					pointer-events: none;
				}

				img.ProseMirror-selectednode {
					outline: 4px solid var(--primary);
					transition: var(--fast) var(--transition);
					transition-property: outline;
				}

				body {
					margin: 20px;
					color: var(--foreground-normal);
					font-family: var(--family-sans-serif);
					background-color: var(--background-input);
					-webkit-font-smoothing: antialiased;
					text-rendering: optimizeLegibility;
					-moz-osx-font-smoothing: grayscale;
				}
				h1 {
					margin-bottom: 0;
					font-weight: 300;
					font-size: 44px;
					line-height: 52px;
				}
				h2 {
					margin-top: 40px;
					margin-bottom: 0;
					font-weight: 600;
					font-size: 34px;
					line-height: 38px;
				}
				h3 {
					margin-top: 40px;
					margin-bottom: 0;
					font-weight: 600;
					font-size: 26px;
					line-height: 31px;
				}
				h4 {
					margin-top: 40px;
					margin-bottom: 0;
					font-weight: 600;
					font-size: 22px;
					line-height: 28px;
				}
				h5 {
					margin-top: 40px;
					margin-bottom: 0;
					font-weight: 600;
					font-size: 18px;
					line-height: 26px;
				}
				h6 {
					margin-top: 40px;
					margin-bottom: 0;
					font-weight: 600;
					font-size: 16px;
					line-height: 24px;
				}
				p {
					margin-top: 20px;
					margin-bottom: 20px;
					font-size: 16px;
					line-height: 32px;
				}
				a {
					color: var(--primary);
					text-decoration: underline;
				}
				ul,
				ol {
					margin: 24px 0;
					font-size: 18px;
					line-height: 34px;
				}
				ul ul,
				ol ol,
				ul ol,
				ol ul {
					margin: 0;
				}
				b,
				strong {
					font-weight: 600;
				}
				blockquote {
					margin-left: -10px;
					padding-left: 10px;
					font-size: 18px;
					font-style: italic;
					line-height: 34px;
					border-left: 2px solid var(--border-normal);
				}
				video,
				iframe,
				img {
					max-width: 100%;
					height: auto;
					border-radius: 4px;
				}
				hr {
					margin-top: 52px;
					margin-bottom: 56px;
					text-align: center;
					border: 1px solid var(--border-normal);
				}
				table {
					border-collapse: collapse;
				}
				table th,
				table td {
					padding: 0.4rem;
					border: 1px solid var(--foreground-normal-alt);
				}
				figure {
					display: table;
					margin: 1rem auto;
				}
				figure figcaption {
					display: block;
					margin-top: 0.25rem;
					color: var(--foreground-subdued);
					text-align: center;
				}
			}
		}
	}
}
</style>
