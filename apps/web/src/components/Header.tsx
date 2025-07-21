"use client";

import { useUser } from "@clerk/clerk-react";
import { SignOutButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./common/Logo";
import { UserNav } from "./common/UserNav";

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
};

const navigation: NavigationItem[] = [
  { name: "Paths", href: "/", current: false },
  { name: "Create", href: "/create", current: false},
  { name: "Account", href: "/stats", current: false },
];

interface HeaderProps {
  onStatsClick?: () => void;
}

export default function Header({ onStatsClick }: HeaderProps) {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <Disclosure as="nav" className=" ">
      {({ open }) => (
        <>
          <div className="flex items-center bg-[#f5f7fa] border-b border-[#dbe4ea] h-16 sm:h-20">
            <div className="container px-2 sm:px-0">
              <div className="relative flex h-16 items-center justify-between w-full px-6">
                <div className="flex sm:hidden shrink-0 items-center justify-center w-full">
                  <Logo isMobile={true} />
                </div>
                <div className="sm:flex hidden shrink-0 items-center">
                  <Logo />
                </div>
                <div className={`flex flex-1 items-center ${!user ? 'justify-center' : 'justify-center'}`}> {/* Always center, but can be customized for user state */}
                  <div className={`hidden sm:block ml-10 ${!user ? 'w-full' : ''}`}> {/* Full width if not signed in */}
                    <ul className={`flex space-x-8 ${!user ? 'ml-96' : ''}`}> {/* Center links if not signed in */}
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className="text-[#3a4a5d] text-center text-xl not-italic font-normal leading-[normal]"
                            aria-current={item.current ? "page" : undefined}
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {user && (
                  <div className="hidden sm:flex absolute inset-y-0 right-0 gap-6 items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                    <SignOutButton>
                      <button
                        type="button"
                        className="px-6 py-2 bg-[#4a90e2] text-white rounded font-semibold hover:bg-[#357ab8] transition text-xl not-italic font-montserrat"
                      >
                        Log Out
                      </button>
                    </SignOutButton>
                    <div className="flex items-center gap-2">
                      <UserNav
                        image={user?.imageUrl}
                        name={user?.fullName || "User"}
                        email={user?.primaryEmailAddress?.emailAddress || ""}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DisclosurePanel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 flex flex-col gap-3 items-start">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className="text-[#2D2D2D] text-center text-xl not-italic font-normal leading-[normal]"
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </DisclosureButton>
              ))}
              {/* No sign in/up buttons in mobile nav */}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}