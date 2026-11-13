const { expect } = require("chai");
const { ethers } = require("hardhat");

const id = (s) => ethers.id(s);
const sha = (s) => ethers.sha256(ethers.toUtf8Bytes(s));

describe("EvidenceRegistry", () => {
  let reg, owner, company, verifier, other;
  beforeEach(async () => {
    [owner, company, verifier, other] = await ethers.getSigners();
    reg = await (await ethers.getContractFactory("EvidenceRegistry")).deploy();
    await reg.setVerifier(verifier.address, true);
  });

  it("registra una evidencia y emite el evento", async () => {
    const h = sha("informe");
    await expect(reg.connect(company).registerEvidence(id("PRJ-1"), id("CMP-1"), h, "oci://t360/ev-1"))
      .to.emit(reg, "EvidenceRegistered")
      .withArgs(h, id("PRJ-1"), id("CMP-1"), company.address, (t) => t > 0n, "oci://t360/ev-1");
    const ev = await reg.getEvidence(h);
    expect(ev.submitter).to.equal(company.address);
    expect(ev.commitmentId).to.equal(id("CMP-1"));
    expect(await reg.isRegistered(h)).to.equal(true);
    expect(await reg.evidenceCount()).to.equal(1n);
  });

  it("rechaza hash nulo, duplicados y referencias largas", async () => {
    await expect(reg.registerEvidence(id("P"), id("C"), ethers.ZeroHash, "")).to.be.revertedWithCustomError(reg, "ZeroHash");
    const h = sha("x");
    await reg.registerEvidence(id("P"), id("C"), h, "");
    await expect(reg.connect(other).registerEvidence(id("P"), id("C"), h, "")).to.be.revertedWithCustomError(reg, "AlreadyRegistered");
    await expect(reg.registerEvidence(id("P"), id("C"), sha("y"), "a".repeat(201))).to.be.revertedWithCustomError(reg, "RefTooLong");
  });

  it("solo verificadores habilitados atestan y nunca sobre su propia evidencia", async () => {
    const h = sha("informe");
    await reg.connect(company).registerEvidence(id("P"), id("C"), h, "");
    await expect(reg.connect(other).attestEvidence(h, 1)).to.be.revertedWithCustomError(reg, "NotVerifier");
    await expect(reg.connect(verifier).attestEvidence(h, 0)).to.be.revertedWithCustomError(reg, "InvalidVerdict");
    await expect(reg.connect(verifier).attestEvidence(h, 1)).to.emit(reg, "EvidenceAttested");
    await expect(reg.connect(verifier).attestEvidence(h, 1)).to.be.revertedWithCustomError(reg, "AlreadyAttested");
    const att = await reg.getAttestations(h);
    expect(att.length).to.equal(1);
    expect(att[0].verifier).to.equal(verifier.address);

    const h2 = sha("autodeclarado");
    await reg.connect(verifier).registerEvidence(id("P"), id("C"), h2, "");
    await expect(reg.connect(verifier).attestEvidence(h2, 1)).to.be.revertedWithCustomError(reg, "SelfAttestation");
    await expect(reg.connect(verifier).attestEvidence(sha("nada"), 1)).to.be.revertedWithCustomError(reg, "UnknownEvidence");
  });

  it("solo el owner gestiona verificadores", async () => {
    await expect(reg.connect(other).setVerifier(other.address, true)).to.be.revertedWithCustomError(reg, "NotOwner");
    await reg.transferOwnership(other.address);
    await reg.connect(other).setVerifier(company.address, true);
    expect(await reg.isVerifier(company.address)).to.equal(true);
  });
});
