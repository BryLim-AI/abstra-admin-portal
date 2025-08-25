import Image from "next/image";

export default function GoogleLogo() {
    return (
        <Image
            src="https://static.cdnlogo.com/logos/g/35/google-icon.svg"
            alt="Google Logo"
            width={20}
            height={20}
            className="mr-3"
        />
    );

}