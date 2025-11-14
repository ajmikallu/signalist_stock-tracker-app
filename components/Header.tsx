import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";

const Header = ({user}:{user:User}) => {
    return (
        <header className="header sticky top-0">
            <div className="header-wrapper container">
                <Link href="/">
                    <Image src="/assets/icons/logo.svg" alt="Signalist" width={140} height={32} className="h-8 w-auto cursor-pointer" />
                </Link>
                <nav className="hidden sm:block">
                    {/*NavItems*/}
                    <NavItems />
                </nav>
                {/*UserDropdown*/}
                <UserDropdown user={user} />
            </div>
        </header>
    )
}
export default Header
