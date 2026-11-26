import React from "react";

const footerLinks = {
  Product: ["Buy Gold", "Upload Gold", "Credit Facility", "Business Account", "Rewards"],
  Company: ["About Us", "Careers", "Blog", "Press"],
  Support: ["Help Center", "Contact Us", "FAQs"],
  Legal: ["Terms of Use", "Privacy Policy", "Cookie Policy"],
};

export default function Footer() {
  return (
    <footer className="bg-[#ffffff] border-t border-[#dedbd4] px-6 pt-16 pb-8 md:px-10 lg:px-[120px]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
        {/* Link columns */}
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4 className="mb-4 text-base font-semibold text-[#26231f]">{title}</h4>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-base text-[#57534c] transition-colors hover:text-[#26231f]">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-[#dedbd4] pt-6 md:flex-row">
        <p className="text-sm text-[#57534c]">
          © {new Date().getFullYear()} IBV Gold. All rights reserved.
        </p>
        <p className="text-center text-sm text-[#57534c]">
          IBV Gold is a registered financial services provider (FSP 51672). All gold is securely vaulted in IBV Vaults.
        </p>
      </div>
    </footer>
  );
}
