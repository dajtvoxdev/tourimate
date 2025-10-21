using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddReportTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("27792418-faaf-44b9-b8dc-69c0936e3d26"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("5eff3f22-46ba-4d26-b985-29d68265086f"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("62fd7f7d-d814-4158-be7d-703b5224d1ea"));

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReportedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Evidence = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ReviewedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Resolution = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Reviews_EntityId",
                        column: x => x.EntityId,
                        principalTable: "Reviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reports_Users_ReportedBy",
                        column: x => x.ReportedBy,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Reports_Users_ReviewedBy",
                        column: x => x.ReviewedBy,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8926), new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8927) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8931), new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8931) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8934), new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8935) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("272cf15e-99c6-4104-b7f3-1a48e20d47bb"), "Finance", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9299), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9299), "0.15" },
                    { new Guid("5e2c16c1-422b-4fa6-bfb4-c103b84d8856"), "Finance", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9294), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9295), "0.15" },
                    { new Guid("767592c4-99a0-47f3-af5c-dff735d79f1f"), "Security", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9302), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9302), "5" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_EntityId",
                table: "Reports",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ReportedBy",
                table: "Reports",
                column: "ReportedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ReviewedBy",
                table: "Reports",
                column: "ReviewedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("272cf15e-99c6-4104-b7f3-1a48e20d47bb"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("5e2c16c1-422b-4fa6-bfb4-c103b84d8856"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("767592c4-99a0-47f3-af5c-dff735d79f1f"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2009), new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2010) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2016), new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2016) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2020), new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2020) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("27792418-faaf-44b9-b8dc-69c0936e3d26"), "Security", new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2594), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2594), "5" },
                    { new Guid("5eff3f22-46ba-4d26-b985-29d68265086f"), "Finance", new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2580), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2581), "0.15" },
                    { new Guid("62fd7f7d-d814-4158-be7d-703b5224d1ea"), "Finance", new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2585), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 21, 4, 9, 17, 124, DateTimeKind.Utc).AddTicks(2586), "0.15" }
                });
        }
    }
}
