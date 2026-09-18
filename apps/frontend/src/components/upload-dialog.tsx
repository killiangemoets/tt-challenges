import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Modal } from '@/components/ui';
import {
  useOrganizationListQuery,
  useUploadDocumentCommand,
} from '@/hooks/data/use-second-brain';
import { getErrorMessage } from '@/resources/api';

const uploadSchema = z.object({
  file: z
    .custom<File>((value) => value instanceof File, 'Choose a markdown file.')
    .refine(
      (file) => file instanceof File && file.name.toLowerCase().endsWith('.md'),
      {
        message: 'Only markdown (.md) files can be ingested.',
      },
    ),
  organizationId: z.string().min(1, 'Choose an organisation.'),
});

type UploadInput = z.infer<typeof uploadSchema>;

export const UploadDialog = ({ onClose }: { onClose: () => void }) => {
  const organizations = useOrganizationListQuery();
  const upload = useUploadDocumentCommand();
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<UploadInput>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { organizationId: '' },
  });

  const onSubmit = async (input: UploadInput) => {
    await upload.mutateAsync(input);
    onClose();
  };

  return (
    <Modal
      title="Add a markdown file"
      description="Stored in MinIO, registered, then queued for asynchronous ingest. .md only."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4 p-5">
          <div>
            <label className="field-label" htmlFor="file">
              File
            </label>
            <Controller
              control={control}
              name="file"
              render={({ field: { onChange, ref } }) => (
                <input
                  accept=".md,text/markdown,text/plain"
                  className="field file:mr-3 file:border-0 file:bg-subtle file:px-3 file:py-1 file:text-xs file:font-medium"
                  id="file"
                  ref={ref}
                  type="file"
                  onChange={(event) => onChange(event.target.files?.[0])}
                />
              )}
            />
            {errors.file && (
              <p className="field-error">{errors.file.message}</p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="organizationId">
              Organisation
            </label>
            <select
              className="field"
              id="organizationId"
              {...register('organizationId')}
            >
              <option value="">Choose an organisation</option>
              {organizations.data?.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                  {organization.kind === 'fund' ? ' (Fund)' : ''}
                </option>
              ))}
            </select>
            {errors.organizationId && (
              <p className="field-error">{errors.organizationId.message}</p>
            )}
          </div>
          {upload.isError && (
            <p className="rounded-sm bg-status-error p-3 text-xs text-destructive">
              {getErrorMessage(upload.error)}
            </p>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-soft px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={upload.isPending} type="submit">
            {upload.isPending ? 'Adding…' : 'Add & queue'}
          </Button>
        </footer>
      </form>
    </Modal>
  );
};
