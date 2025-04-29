"use client";

import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { cn } from "@/lib/utils";

export interface FileUploaderProps
  extends React.ComponentPropsWithoutRef<"div"> {
  dropzoneOptions?: Omit<DropzoneOptions, "onDrop">;
  value?: File[] | null;
  onValueChange?: (files: File[] | null) => void;
}

export const FileUploader = React.forwardRef<
  HTMLDivElement,
  FileUploaderProps
>(
  (
    { dropzoneOptions, value, onValueChange, className, children, ...props },
    ref
  ) => {
    const onDrop = React.useCallback(
      (acceptedFiles: File[]) => {
        onValueChange?.(acceptedFiles);
      },
      [onValueChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      ...dropzoneOptions,
      onDrop,
    });

    return (
      <div
        ref={ref}
        className={cn(
          "relative grid w-full gap-2 rounded-lg border border-dashed p-4",
          isDragActive && "border-muted-foreground/50",
          className
        )}
        {...getRootProps()}
        {...props}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    );
  }
);
FileUploader.displayName = "FileUploader";

export interface FileUploaderContentProps
  extends React.ComponentPropsWithoutRef<"div"> {}

export const FileUploaderContent = React.forwardRef<
  HTMLDivElement,
  FileUploaderContentProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("grid w-full gap-2 rounded-lg", className)}
      {...props}
    />
  );
});
FileUploaderContent.displayName = "FileUploaderContent";

export interface FileUploaderItemProps
  extends React.ComponentPropsWithoutRef<"div"> {
  index: number;
}

export const FileUploaderItem = React.forwardRef<
  HTMLDivElement,
  FileUploaderItemProps
>(({ className, index, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        className
      )}
      {...props}
    />
  );
});
FileUploaderItem.displayName = "FileUploaderItem";

export interface FileInputProps extends React.ComponentPropsWithoutRef<"div"> {}

export const FileInput = React.forwardRef<HTMLDivElement, FileInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-2 py-4 text-center",
          className
        )}
        {...props}
      />
    );
  }
);
FileInput.displayName = "FileInput";
