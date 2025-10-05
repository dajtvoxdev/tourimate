using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddFirebaseUidToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Revenue_Transactions_TransactionId",
                table: "Revenue");

            migrationBuilder.DropForeignKey(
                name: "FK_Revenue_Users_UserId",
                table: "Revenue");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewHelpfulVotes_Reviews_ReviewId",
                table: "ReviewHelpfulVotes");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewHelpfulVotes_Users_UserId",
                table: "ReviewHelpfulVotes");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewReplies_Reviews_ReviewId",
                table: "ReviewReplies");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewReplies_Users_UserId",
                table: "ReviewReplies");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0fe96844-3b5d-489d-885d-febd02025f97"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("5064cd96-d73c-4c0b-9779-7dfb3b928100"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("ce7950ce-4fac-447f-b15a-457fca712768"));

            migrationBuilder.AddColumn<string>(
                name: "FirebaseUid",
                table: "Users",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId1",
                table: "ReviewReplies",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7565), new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7566) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7571), new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7572) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7575), new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7575) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("5729e17f-ff0a-4ebf-811d-9f44765a163a"), "Finance", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8444), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8445), "0.15" },
                    { new Guid("8a3d5ef3-672a-4642-af4e-4cf6a47bd15b"), "Security", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8453), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8453), "5" },
                    { new Guid("f080e03c-b5eb-475d-8381-4fb82ac5f01f"), "Finance", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8449), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8450), "0.15" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReviewReplies_UserId1",
                table: "ReviewReplies",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Revenue_Transactions_TransactionId",
                table: "Revenue",
                column: "TransactionId",
                principalTable: "Transactions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Revenue_Users_UserId",
                table: "Revenue",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewHelpfulVotes_Reviews_ReviewId",
                table: "ReviewHelpfulVotes",
                column: "ReviewId",
                principalTable: "Reviews",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewHelpfulVotes_Users_UserId",
                table: "ReviewHelpfulVotes",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewReplies_Reviews_ReviewId",
                table: "ReviewReplies",
                column: "ReviewId",
                principalTable: "Reviews",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewReplies_Users_UserId",
                table: "ReviewReplies",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewReplies_Users_UserId1",
                table: "ReviewReplies",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Revenue_Transactions_TransactionId",
                table: "Revenue");

            migrationBuilder.DropForeignKey(
                name: "FK_Revenue_Users_UserId",
                table: "Revenue");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewHelpfulVotes_Reviews_ReviewId",
                table: "ReviewHelpfulVotes");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewHelpfulVotes_Users_UserId",
                table: "ReviewHelpfulVotes");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewReplies_Reviews_ReviewId",
                table: "ReviewReplies");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewReplies_Users_UserId",
                table: "ReviewReplies");

            migrationBuilder.DropForeignKey(
                name: "FK_ReviewReplies_Users_UserId1",
                table: "ReviewReplies");

            migrationBuilder.DropIndex(
                name: "IX_ReviewReplies_UserId1",
                table: "ReviewReplies");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("5729e17f-ff0a-4ebf-811d-9f44765a163a"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("8a3d5ef3-672a-4642-af4e-4cf6a47bd15b"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("f080e03c-b5eb-475d-8381-4fb82ac5f01f"));

            migrationBuilder.DropColumn(
                name: "FirebaseUid",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "ReviewReplies");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(3888), new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(3889) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(3894), new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(3894) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(3898), new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(3899) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0fe96844-3b5d-489d-885d-febd02025f97"), "Finance", new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(4118), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(4118), "0.15" },
                    { new Guid("5064cd96-d73c-4c0b-9779-7dfb3b928100"), "Security", new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(4142), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(4142), "5" },
                    { new Guid("ce7950ce-4fac-447f-b15a-457fca712768"), "Finance", new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(4114), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 9, 29, 12, 52, 41, 455, DateTimeKind.Utc).AddTicks(4115), "0.15" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Revenue_Transactions_TransactionId",
                table: "Revenue",
                column: "TransactionId",
                principalTable: "Transactions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Revenue_Users_UserId",
                table: "Revenue",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewHelpfulVotes_Reviews_ReviewId",
                table: "ReviewHelpfulVotes",
                column: "ReviewId",
                principalTable: "Reviews",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewHelpfulVotes_Users_UserId",
                table: "ReviewHelpfulVotes",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewReplies_Reviews_ReviewId",
                table: "ReviewReplies",
                column: "ReviewId",
                principalTable: "Reviews",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewReplies_Users_UserId",
                table: "ReviewReplies",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
