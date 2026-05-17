import { ChevronDown } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

interface Option {
	value: string;
	label: React.ReactNode;
}

interface CustomSelectProps {
	value?: string;
	defaultValue?: string;
	onChange?: (value: string) => void;
	options: Option[];
	name?: string;
	className?: string;
	dropdownClassName?: string;
	icon?: React.ReactNode;
}

export function CustomSelect({
	value,
	defaultValue,
	onChange,
	options,
	name,
	className,
	dropdownClassName,
	icon,
}: CustomSelectProps) {
	const [internalValue, setInternalValue] = useState(defaultValue || options[0]?.value || "");
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const currentValue = value !== undefined ? value : internalValue;
	const selectedOption = options.find((o) => o.value === currentValue) || options[0];

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (val: string) => {
		setInternalValue(val);
		onChange?.(val);
		setIsOpen(false);
	};

	return (
		<div className="relative inline-block" ref={containerRef}>
			{name && <input type="hidden" name={name} value={currentValue} />}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn("flex items-center justify-between gap-2 focus:outline-none", className)}
			>
				<div className="flex items-center gap-1.5 truncate">
					{icon}
					<span className="truncate">{selectedOption?.label}</span>
				</div>
				<ChevronDown className="w-3.5 h-3.5 text-theme-text-secondary opacity-70 flex-shrink-0" />
			</button>

			{isOpen && (
				<div
					className={cn(
						"absolute top-full left-0 mt-1 min-w-full w-max bg-theme-surface border border-theme-border rounded-lg shadow-xl z-50 py-1",
						dropdownClassName,
					)}
				>
					{options.map((opt) => (
						<button
							key={opt.value}
							type="button"
							className={cn(
								"w-full text-left px-3 py-1.5 text-sm hover:bg-theme-surface-hover transition-colors",
								opt.value === currentValue
									? "text-theme-text font-medium bg-theme-surface-active"
									: "text-theme-text-secondary hover:text-theme-text",
							)}
							onClick={() => handleSelect(opt.value)}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
