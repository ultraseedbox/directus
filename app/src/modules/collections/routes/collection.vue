<template>
	<collections-not-found v-if="!currentCollection || collection.startsWith('directus_')" />
	<private-view v-else :title="bookmark ? bookmarkTitle : currentCollection.name">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary disabled>
				<v-icon :name="currentCollection.icon" :color="currentCollection.color" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb v-if="bookmark" :items="breadcrumb" />
			<v-breadcrumb v-else :items="[{ name: t('collections'), to: '/collections' }]" />
		</template>

		<template #title-outer:append>
			<div class="bookmark-controls">
				<bookmark-add
					v-if="!bookmark"
					v-model="bookmarkDialogActive"
					class="add"
					:saving="creatingBookmark"
					@save="createBookmark"
				>
					<template #activator="{ on }">
						<v-icon
							v-tooltip.right="t('create_bookmark')"
							class="toggle"
							clickable
							name="bookmark_outline"
							@click="on"
						/>
					</template>
				</bookmark-add>

				<v-icon v-else-if="bookmarkSaved" class="saved" name="bookmark" />

				<template v-else-if="bookmarkIsMine">
					<v-icon
						v-tooltip.bottom="t('update_bookmark')"
						class="save"
						clickable
						name="bookmark_save"
						@click="savePreset()"
					/>
				</template>

				<bookmark-add
					v-else
					v-model="bookmarkDialogActive"
					class="add"
					:saving="creatingBookmark"
					@save="createBookmark"
				>
					<template #activator="{ on }">
						<v-icon class="toggle" name="bookmark_outline" clickable @click="on" />
					</template>
				</bookmark-add>

				<v-icon
					v-if="bookmark && !bookmarkSaving && bookmarkSaved === false"
					v-tooltip.bottom="t('reset_bookmark')"
					name="settings_backup_restore"
					clickable
					class="clear"
					@click="clearLocalSave"
				/>
			</div>
		</template>

		<template #actions:prepend>
			<component :is="`layout-actions-${layout || 'tabular'}`" />
		</template>

		<template #actions>
			<search-input v-model="searchQuery" />

			<v-dialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="batchDeleteAllowed ? t('delete_label') : t('not_allowed')"
						:disabled="batchDeleteAllowed !== true"
						rounded
						icon
						class="action-delete"
						@click="on"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button class="action-delete" :loading="deleting" @click="batchDelete">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog
				v-if="selection.length > 0 && currentCollection.meta && currentCollection.meta.archive_field"
				v-model="confirmArchive"
				@esc="confirmArchive = false"
			>
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="batchArchiveAllowed ? t('archive') : t('not_allowed')"
						:disabled="batchArchiveAllowed !== true"
						rounded
						icon
						class="action-archive"
						@click="on"
					>
						<v-icon name="archive" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('archive_confirm_count', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmArchive = false">
							{{ t('cancel') }}
						</v-button>
						<v-button class="action-archive" :loading="archiving" @click="archive">
							{{ t('archive') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-if="selection.length > 1"
				v-tooltip.bottom="batchEditAllowed ? t('edit') : t('not_allowed')"
				rounded
				icon
				class="action-batch"
				:disabled="batchEditAllowed === false"
				@click="batchEditActive = true"
			>
				<v-icon name="edit" outline />
			</v-button>

			<v-button
				v-tooltip.bottom="createAllowed ? t('create_item') : t('not_allowed')"
				rounded
				icon
				:to="addNewLink"
				:disabled="createAllowed === false"
			>
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation-search />
			<collections-navigation />
		</template>

		<v-info
			v-if="bookmark && bookmarkExists === false"
			type="warning"
			:title="t('bookmark_doesnt_exist')"
			icon="bookmark"
			center
		>
			{{ t('bookmark_doesnt_exist_copy') }}

			<template #append>
				<v-button :to="currentCollectionLink">
					{{ t('bookmark_doesnt_exist_cta') }}
				</v-button>
			</template>
		</v-info>

		<component :is="`layout-${layout || 'tabular'}`" v-else class="layout">
			<template #no-results>
				<v-info :title="t('no_results')" icon="search" center>
					{{ t('no_results_copy') }}

					<template #append>
						<v-button @click="clearFilters">{{ t('clear_filters') }}</v-button>
					</template>
				</v-info>
			</template>

			<template #no-items>
				<v-info :title="t('item_count', 0)" :icon="currentCollection.icon" center>
					{{ t('no_items_copy') }}

					<template v-if="createAllowed" #append>
						<v-button :to="`/collections/${collection}/+`">{{ t('create_item') }}</v-button>
					</template>
				</v-info>
			</template>
		</component>

		<drawer-batch
			v-model:active="batchEditActive"
			:primary-keys="selection"
			:collection="collection"
			@refresh="refresh"
		/>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div
					v-md="t('page_help_collections_collection', { collection: currentCollection.name })"
					class="page-description"
				/>
			</sidebar-detail>
			<layout-sidebar-detail v-model="layout" />
			<component :is="`layout-sidebar-${layout || 'tabular'}`" />
			<refresh-sidebar-detail v-model="refreshInterval" @refresh="refresh" />
		</template>

		<v-dialog :model-value="deleteError !== null">
			<v-card>
				<v-card-title>{{ t('something_went_wrong') }}</v-card-title>
				<v-card-text>
					<v-error :error="deleteError" />
				</v-card-text>
				<v-card-actions>
					<v-button @click="deleteError = null">{{ t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref, reactive, watch, toRefs } from 'vue';
import CollectionsNavigation from '../components/navigation.vue';
import CollectionsNavigationSearch from '../components/navigation-search.vue';
import api from '@/api';
import CollectionsNotFound from './not-found.vue';
import useCollection from '@/composables/use-collection';
import { useLayout } from '@/composables/use-layout';
import usePreset from '@/composables/use-preset';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail';
import SearchInput from '@/views/private/components/search-input';
import BookmarkAdd from '@/views/private/components/bookmark-add';
import BookmarkEdit from '@/views/private/components/bookmark-edit';
import { useRouter } from 'vue-router';
import { usePermissionsStore, useUserStore } from '@/stores';
import DrawerBatch from '@/views/private/components/drawer-batch';
import { unexpectedError } from '@/utils/unexpected-error';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'CollectionsCollection',
	components: {
		CollectionsNavigation,
		CollectionsNavigationSearch,
		CollectionsNotFound,
		LayoutSidebarDetail,
		SearchInput,
		BookmarkAdd,
		BookmarkEdit,
		DrawerBatch,
		RefreshSidebarDetail,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
		bookmark: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		const userStore = useUserStore();
		const permissionsStore = usePermissionsStore();

		const { collection } = toRefs(props);
		const bookmarkID = computed(() => (props.bookmark ? +props.bookmark : null));

		const { selection } = useSelection();
		const { info: currentCollection } = useCollection(collection);
		const { addNewLink, currentCollectionLink } = useLinks();
		const { breadcrumb } = useBreadcrumb();

		const {
			layout,
			layoutOptions,
			layoutQuery,
			filters,
			searchQuery,
			savePreset,
			bookmarkExists,
			saveCurrentAsBookmark,
			bookmarkTitle,
			resetPreset,
			bookmarkSaved,
			bookmarkIsMine,
			refreshInterval,
			busy: bookmarkSaving,
			clearLocalSave,
		} = usePreset(collection, bookmarkID);

		const layoutState = useLayout(
			layout,
			reactive({
				collection,
				selection,
				layoutOptions,
				layoutQuery,
				filters,
				searchQuery,
				resetPreset,
				selectMode: false,
				readonly: false,
			})
		);

		const {
			confirmDelete,
			deleting,
			batchDelete,
			confirmArchive,
			archive,
			archiving,
			error: deleteError,
			batchEditActive,
		} = useBatch();

		const { bookmarkDialogActive, creatingBookmark, createBookmark, editingBookmark, editBookmark } = useBookmarks();

		watch(
			collection,
			() => {
				if (layout.value === null) {
					layout.value = 'tabular';
				}
			},
			{ immediate: true }
		);

		const { batchEditAllowed, batchArchiveAllowed, batchDeleteAllowed, createAllowed } = usePermissions();

		return {
			t,
			addNewLink,
			batchDelete,
			batchEditActive,
			confirmDelete,
			currentCollection,
			deleting,
			filters,
			layoutState,
			selection,
			layoutOptions,
			layoutQuery,
			layout,
			searchQuery,
			savePreset,
			bookmarkExists,
			currentCollectionLink,
			bookmarkDialogActive,
			creatingBookmark,
			createBookmark,
			bookmarkTitle,
			editingBookmark,
			editBookmark,
			breadcrumb,
			clearFilters,
			confirmArchive,
			archive,
			archiving,
			batchEditAllowed,
			batchArchiveAllowed,
			batchDeleteAllowed,
			deleteError,
			createAllowed,
			resetPreset,
			bookmarkSaved,
			bookmarkIsMine,
			bookmarkSaving,
			clearLocalSave,
			refresh,
			refreshInterval,
		};

		function refresh() {
			layoutState.value.refresh();
		}

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: currentCollection.value?.name,
					to: `/collections/${props.collection}`,
				},
			]);

			return { breadcrumb };
		}

		function useSelection() {
			const selection = ref<Item[]>([]);

			// Whenever the collection we're working on changes, we have to clear the selection
			watch(
				() => props.collection,
				() => (selection.value = [])
			);

			return { selection };
		}

		function useBatch() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			const batchEditActive = ref(false);

			const confirmArchive = ref(false);
			const archiving = ref(false);

			const error = ref<any>(null);

			return { batchEditActive, confirmDelete, deleting, batchDelete, confirmArchive, archiving, archive, error };

			async function batchDelete() {
				deleting.value = true;

				const batchPrimaryKeys = selection.value;

				try {
					await api.delete(`/items/${props.collection}`, {
						data: batchPrimaryKeys,
					});

					await layoutState.value?.refresh?.();

					selection.value = [];
					confirmDelete.value = false;
				} catch (err) {
					error.value = err;
				} finally {
					deleting.value = false;
				}
			}

			async function archive() {
				if (!currentCollection.value?.meta?.archive_field) return;

				archiving.value = true;

				try {
					await api.patch(`/items/${props.collection}`, {
						keys: selection.value,
						data: {
							[currentCollection.value.meta.archive_field]: currentCollection.value.meta.archive_value,
						},
					});

					confirmArchive.value = false;
					selection.value = [];

					await layoutState.value?.refresh?.();
				} catch (err) {
					error.value = err;
				} finally {
					archiving.value = false;
				}
			}
		}

		function useLinks() {
			const addNewLink = computed<string>(() => {
				return `/collections/${props.collection}/+`;
			});

			const currentCollectionLink = computed<string>(() => {
				return `/collections/${props.collection}`;
			});

			return { addNewLink, currentCollectionLink };
		}

		function useBookmarks() {
			const bookmarkDialogActive = ref(false);
			const creatingBookmark = ref(false);
			const editingBookmark = ref(false);

			return {
				bookmarkDialogActive,
				creatingBookmark,
				createBookmark,
				editingBookmark,
				editBookmark,
			};

			async function createBookmark(name: string) {
				creatingBookmark.value = true;

				try {
					const newBookmark = await saveCurrentAsBookmark({ bookmark: name });
					router.push(`/collections/${newBookmark.collection}?bookmark=${newBookmark.id}`);

					bookmarkDialogActive.value = false;
				} catch (err) {
					unexpectedError(err);
				} finally {
					creatingBookmark.value = false;
				}
			}

			async function editBookmark(name: string) {
				bookmarkTitle.value = name;
				bookmarkDialogActive.value = false;
			}
		}

		function clearFilters() {
			filters.value = [];
			searchQuery.value = null;
		}

		function usePermissions() {
			const batchEditAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const updatePermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'update' && permission.collection === collection.value
				);
				return !!updatePermissions;
			});

			const batchArchiveAllowed = computed(() => {
				if (!currentCollection.value?.meta?.archive_field) return false;
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const updatePermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'update' && permission.collection === collection.value
				);
				if (!updatePermissions) return false;
				if (!updatePermissions.fields) return false;
				if (updatePermissions.fields.includes('*')) return true;
				return updatePermissions.fields.includes(currentCollection.value.meta.archive_field);
			});

			const batchDeleteAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const deletePermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'delete' && permission.collection === collection.value
				);
				return !!deletePermissions;
			});

			const createAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const createPermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'create' && permission.collection === collection.value
				);
				return !!createPermissions;
			});

			return { batchEditAllowed, batchArchiveAllowed, batchDeleteAllowed, createAllowed };
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.action-archive {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.action-batch {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
	--v-button-background-color-active: var(--background-normal);
	--v-button-background-color-hover: var(--background-normal-alt);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.layout {
	--layout-offset-top: 64px;
}

.bookmark-controls {
	.add,
	.save,
	.saved,
	.clear {
		display: inline-block;
		margin-left: 8px;
	}

	.add,
	.save,
	.clear {
		cursor: pointer;
		transition: color var(--fast) var(--transition);
	}

	.add {
		color: var(--foreground-subdued);

		&:hover {
			color: var(--foreground-normal);
		}
	}

	.save {
		color: var(--warning);

		&:hover {
			color: var(--warning-125);
		}
	}

	.clear {
		margin-left: 4px;
		color: var(--foreground-subdued);

		&:hover {
			color: var(--warning);
		}
	}

	.saved {
		color: var(--primary);
	}
}
</style>
