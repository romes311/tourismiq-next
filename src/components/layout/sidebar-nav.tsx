"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Network", href: "/network", icon: UsersIcon },
  { name: "Events", href: "/events", icon: CalendarIcon },
  { name: "Destinations", href: "/destinations", icon: MapPinIcon },
  { name: "Marketplace", href: "/marketplace", icon: BuildingStorefrontIcon },
  { name: "Messages", href: "/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Notifications", href: "/notifications", icon: BellIcon },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-100 hover:text-neutral-900",
              pathname === item.href
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-500"
            )}
          >
            <Icon className="mr-3 h-5 w-5 shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
