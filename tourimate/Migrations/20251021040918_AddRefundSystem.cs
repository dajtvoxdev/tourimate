using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0463eb90-89f0-43b6-9e53-7948ceb5a52d"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("2feafca7-229c-4e27-bd93-b43da60693be"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("d7d2489f-970f-4152-8fc6-7a529e695dfd"));

            migrationBuilder.AddColumn<string>(
                name: "RefundAccountName",
                table: "Bookings",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundBankAccount",
                table: "Bookings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundBankCode",
                table: "Bookings",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundBankName",
                table: "Bookings",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Refunds",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RefundAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    RefundStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RefundBankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RefundBankAccount = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RefundBankCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RefundAccountName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RefundReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RefundReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RefundProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RefundCompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RefundNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DaysBeforeTour = table.Column<int>(type: "int", nullable: false),
                    RefundPercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    OriginalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Refunds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Refunds_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_BookingId",
                table: "Refunds",
                column: "BookingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Refunds");

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

            migrationBuilder.DropColumn(
                name: "RefundAccountName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RefundBankAccount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RefundBankCode",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RefundBankName",
                table: "Bookings");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6124), new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6126) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6131), new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6131) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6135), new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6135) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0463eb90-89f0-43b6-9e53-7948ceb5a52d"), "Finance", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6415), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6415), "0.15" },
                    { new Guid("2feafca7-229c-4e27-bd93-b43da60693be"), "Finance", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6428), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6428), "0.15" },
                    { new Guid("d7d2489f-970f-4152-8fc6-7a529e695dfd"), "Security", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6431), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6432), "5" }
                });
        }
    }
}
